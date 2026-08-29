/* eslint-disable @typescript-eslint/no-explicit-any */
// apps/web/src/app/api/chat/route.ts
//
// Public chatbot endpoint, powered by Groq (genuinely free tier, no
// credit card, no trial expiry). Lets the model call tools to pull real
// data from Supabase (colleges, exams, careers, cutoffs, placements)
// before answering — so it never invents numbers.
//
// Requires in .env.local:
//   GROQ_API_KEY=gsk_...   (get this free at console.groq.com/keys)
//
// npm uninstall @anthropic-ai/sdk @google/genai   (remove old providers, if present)
// npm install groq-sdk   (run this in apps/web)

import { NextRequest, NextResponse } from 'next/server'
import Groq from 'groq-sdk'
import { GROQ_TOOLS, executeTool } from '@/lib/chat-tools'
import { checkRateLimit, getClientIp } from '@/lib/rate-limit'

export const runtime = 'nodejs'
export const maxDuration = 30

const groqApiKey = process.env.GROQ_API_KEY
if (!groqApiKey) {
  throw new Error('Missing GROQ_API_KEY env var — required for the chatbot.')
}
const groq = new Groq({ apiKey: groqApiKey })

// openai/gpt-oss-120b is Groq's current recommended free-tier model for
// tool use and general reasoning (llama-3.3-70b-versatile was deprecated
// and shut down August 16, 2026). If you hit rate limits under heavy
// testing, drop to 'openai/gpt-oss-20b' for higher request/day headroom.
const MODEL = 'openai/gpt-oss-120b'

const SYSTEM_PROMPT = `You are the CareerGuide Assistant, a friendly guide for Indian students exploring colleges, entrance exams, and careers.

Rules you must follow:
- For ANY question involving specific facts — cutoffs, fees, placement packages, seat counts, exam dates, eligibility criteria, NIRF ranks — you MUST call a tool to look up real data first. Never state a specific number from memory.
- If a tool returns no data or an error, say clearly that you don't have that information yet, rather than guessing or making something up.
- When a search tool returns multiple results, briefly list the options and ask which one the user means, or pick the most obviously relevant one if it's clear from context.
- You can freely give general, non-factual guidance (how to prepare for exams, how to choose a stream, general study tips) without needing a tool call.
- Keep answers concise and conversational — this is a chat widget, not a report. Use short paragraphs or brief bullet points, not long headers.
- If the user explicitly asks you to change your response style — shorter, longer, no bullet points, a specific number of sentences, etc. — follow that instruction exactly for the rest of the conversation, even if it means being less thorough than you'd default to.
- If asked something totally unrelated to Indian education/careers/colleges, gently redirect back to what you can help with.
- Never fabricate a college, exam, or career that a search tool didn't return.`

type ChatMessage = { role: 'user' | 'assistant'; content: string }

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req.headers)
    const rateCheck = checkRateLimit(ip)

    if (!rateCheck.allowed) {
      const message =
        rateCheck.reason === 'daily'
          ? "You've reached today's message limit for this assistant. Please try again tomorrow."
          : `You're sending messages too quickly. Please wait ${rateCheck.retryAfterSeconds}s and try again.`

      return NextResponse.json(
        { error: message },
        { status: 429, headers: { 'Retry-After': String(rateCheck.retryAfterSeconds) } }
      )
    }

    const body = await req.json()
    const messages: ChatMessage[] = body.messages

    if (!Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json({ error: 'messages array is required' }, { status: 400 })
    }

    // Cap history sent to the model to keep latency bounded and stay
    // comfortably inside free-tier token limits
    const recentMessages = messages.slice(-20)

    // Groq uses the OpenAI chat format directly — role/content pairs,
    // plus a leading system message.
    //
    // Typed as any[] rather than the SDK's strict union type: the SDK's
    // ChatCompletionMessageParam type is a discriminated union that's
    // awkward to satisfy when you're building the array incrementally
    // (pushing assistant messages with tool_calls, then tool-result
    // messages, in a loop). The actual JSON shapes below are correct
    // and match what Groq's API expects; this just avoids fighting the
    // type checker over it.
    const groqMessages: any[] = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...recentMessages.map((m) => ({ role: m.role, content: m.content })),
    ]

    // Tool-use loop: the model may call tools multiple times before
    // answering. Capped at 6 rounds — gpt-oss-120b sometimes needs a few
    // extra turns to wrap up after a tool call before it settles on a
    // final text answer.
    let finalText: string | null = null
    for (let round = 0; round < 6; round++) {
      const response = await groq.chat.completions.create({
        model: MODEL,
        messages: groqMessages,
        tools: GROQ_TOOLS as any,
        tool_choice: 'auto',
      })

      const message = response.choices[0].message

      if (!message.tool_calls || message.tool_calls.length === 0) {
        finalText = message.content ?? ''
        break
      }

      // Append the assistant's turn (including its tool-call request) so
      // it has that context on the next round
      groqMessages.push(message)

      // Execute every requested tool call and feed each result back in as
      // its own 'tool' role message, matched by tool_call_id
      for (const toolCall of message.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments || '{}')
        const result = await executeTool(toolCall.function.name, args)
        groqMessages.push({
          role: 'tool',
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        })
      }
    }

    if (finalText === null) {
      finalText =
        "I'm having trouble finding a clear answer to that — could you try rephrasing, or ask about a specific college, exam, or career?"
    }

    return NextResponse.json({ reply: finalText })
  } catch (err: any) {
    console.error('Chat API error:', err)
    return NextResponse.json(
      { error: 'Something went wrong answering that. Please try again.' },
      { status: 500 }
    )
  }
}