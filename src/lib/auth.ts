import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        console.log('--- AUTH ATTEMPT ---')
        console.log('Email:', credentials?.email)

        if (!credentials?.email || !credentials?.password) {
          console.error('Missing email or password')
          throw new Error('Email and password are required')
        }

        const email = credentials.email.trim().toLowerCase()
        const password = credentials.password.trim()

        const user = await prisma.user.findUnique({
          where: { email },
        })

        if (!user) {
          console.error('User not found:', email)
          throw new Error('Account not found. Please check your email or register.')
        }

        console.log('User found, comparing password...')
        const isValid = await bcrypt.compare(password, user.passwordHash)
        
        if (!isValid) {
          console.error('Invalid password for user:', credentials.email)
          return null
        }

        console.log('Auth successful for:', credentials.email)
        return {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          designation: user.designation,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.designation = (user as any).designation
        token.id = user.id
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).role = token.role
        ;(session.user as any).designation = token.designation
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  debug: true,
  secret: process.env.NEXTAUTH_SECRET,
}
