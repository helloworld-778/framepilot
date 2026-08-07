import { type EmailOtpType } from '@supabase/supabase-js'
import { type NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server-ssr'

export async function GET(request: NextRequest) {
    const { searchParams, origin } = new URL(request.url)
    const tokenHash = searchParams.get('token_hash')
    const type = searchParams.get('type') as EmailOtpType | null

    if (tokenHash && type) {
        const supabase = await createClient()

        const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type,
        })

        if (!error) {
            return NextResponse.redirect(new URL('/projects', origin))
        }
    }

    return NextResponse.redirect(
        new URL(
            '/sign-in?message=Your confirmation link is invalid or has expired.',
            origin,
        ),
    )
}
