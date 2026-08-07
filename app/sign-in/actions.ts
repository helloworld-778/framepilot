'use server'

import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server-ssr'

function messagePath(message: string) {
    return `/sign-in?message=${encodeURIComponent(message)}`
}

export async function signIn(formData: FormData) {
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!email || !password) {
        redirect(messagePath('Enter both your email and password.'))
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect(messagePath('Sign-in failed. Check your email and password.'))
    }

    redirect('/projects')
}

export async function signUp(formData: FormData) {
    const email = String(formData.get('email') ?? '').trim()
    const password = String(formData.get('password') ?? '')

    if (!email || !password) {
        redirect(messagePath('Enter both your email and password.'))
    }

    if (password.length < 8) {
        redirect(messagePath('Use a password with at least 8 characters.'))
    }

    const supabase = await createClient()

    const { error } = await supabase.auth.signUp({
        email,
        password,
    })

    if (error) {
        redirect(messagePath('Could not create the account. Try another email.'))
    }

    redirect(
        messagePath('Check your email and confirm your account before signing in.'),
    )
}

export async function signOut() {
    const supabase = await createClient()

    await supabase.auth.signOut()

    redirect('/')
}
