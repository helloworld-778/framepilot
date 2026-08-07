import Link from 'next/link'
import { signIn, signUp } from './actions'

type SignInPageProps = {
    searchParams: Promise<{
        message?: string
    }>
}

export default async function SignInPage({
    searchParams,
}: SignInPageProps) {
    const { message } = await searchParams

    return (
        <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-6 py-16">
            <section className="w-full rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/20 sm:p-8">
                <Link
                    href="/"
                    className="text-sm text-white/60 transition hover:text-white"
                >
                    ← Back to FramePilot
                </Link>

                <h1 className="mt-8 text-3xl font-semibold tracking-tight text-white">
                    Sign in to FramePilot
                </h1>

                <p className="mt-2 text-sm leading-6 text-white/60">
                    Signing in is optional. Your existing local workspace remains available
                    either way.
                </p>

                {message ? (
                    <p
                        className="mt-6 rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm text-white/80"
                        role="status"
                    >
                        {message}
                    </p>
                ) : null}

                <form className="mt-6 space-y-5">
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-medium text-white">
                            Email
                        </label>

                        <input
                            id="email"
                            name="email"
                            type="email"
                            autoComplete="email"
                            required
                            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2.5 text-white outline-none placeholder:text-white/35 focus:border-white/50"
                            placeholder="you@example.com"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-medium text-white">
                            Password
                        </label>

                        <input
                            id="password"
                            name="password"
                            type="password"
                            autoComplete="current-password"
                            required
                            minLength={8}
                            className="w-full rounded-lg border border-white/15 bg-black/20 px-3 py-2.5 text-white outline-none placeholder:text-white/35 focus:border-white/50"
                            placeholder="At least 8 characters"
                        />
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                        <button
                            formAction={signIn}
                            className="rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-black transition hover:bg-white/90"
                        >
                            Sign in
                        </button>

                        <button
                            formAction={signUp}
                            className="rounded-lg border border-white/20 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
                        >
                            Create account
                        </button>
                    </div>
                </form>
            </section>
        </main>
    )
}