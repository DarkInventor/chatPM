import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { messages } = body

    console.log('Chat API called with:', {
      messageCount: messages?.length,
      hasMessages: !!messages,
      firstMessage: messages?.[0]?.role
    })

    if (!messages || !Array.isArray(messages)) {
      console.error('Invalid messages format:', messages)
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('Anthropic API key not configured')
      return NextResponse.json(
        { error: 'Anthropic API key not configured' },
        { status: 500 }
      )
    }

    // Validate API key format
    if (!process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-')) {
      console.error('Invalid Anthropic API key format')
      return NextResponse.json(
        { error: 'Invalid API key format' },
        { status: 500 }
      )
    }

    // Prepare the request payload
    const requestPayload = {
      model: 'claude-3-5-sonnet-20241022',
      max_tokens: 1024,
      messages: messages.map(msg => ({
        role: msg.role === 'system' ? 'user' : msg.role, // Anthropic doesn't support system role directly
        content: msg.role === 'system' ? `[System Context] ${msg.content}` : msg.content
      }))
    }

    console.log('Sending request to Anthropic:', {
      model: requestPayload.model,
      messageCount: requestPayload.messages.length,
      totalChars: JSON.stringify(requestPayload.messages).length
    })

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify(requestPayload)
    })

    console.log('Anthropic API response status:', response.status, response.statusText)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Anthropic API error response:', {
        status: response.status,
        statusText: response.statusText,
        body: errorText
      })
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { error: errorText }
      }

      return NextResponse.json(
        { 
          error: `Claude API error: ${errorData.error?.message || errorData.error || 'Unknown error'}`,
          details: errorData
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    console.log('Anthropic API success:', {
      hasContent: !!data.content,
      contentLength: data.content?.[0]?.text?.length || 0
    })
    
    if (!data.content || !data.content[0] || !data.content[0].text) {
      console.error('Invalid response format from Anthropic:', data)
      return NextResponse.json(
        { error: 'Invalid response format from Claude' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      content: data.content[0].text,
      usage: data.usage
    })
  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}