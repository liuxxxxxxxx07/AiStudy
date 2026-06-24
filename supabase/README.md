# Supabase Setup Guide

This project uses Supabase for authentication, database, and file storage.

## Prerequisites

A Supabase project is already configured:
- URL: `https://pooifqbzwwmbkachgvmvu.supabase.co`
- Anon Key: set in `.env.local`

## Step 1: Run Database Migrations

1. Go to your Supabase Dashboard → **SQL Editor**
2. Open `supabase/migrations/001_schema.sql`, copy all content
3. Paste into SQL Editor and click **Run**
4. Verify all tables created: profiles, credits, subscriptions, conversations, messages, questions, exam_results, knowledge_entries, wiki_entries, wiki_links

## Step 2: Configure Storage

1. In Supabase Dashboard → **Storage**
2. Or run `supabase/migrations/002_storage.sql` in SQL Editor
3. Verify bucket `user-files` was created

## Step 3: Enable OAuth Providers

For Google/GitHub login to work, you must enable OAuth in your Supabase project:

1. Supabase Dashboard → **Authentication** → **Providers**
2. Click **Google** → toggle **Enabled** → enter:
   - **Client ID** – from [Google Cloud Console](https://console.cloud.google.com/apis/credentials)
   - **Client Secret** – from Google Cloud Console
   - Save
3. Click **GitHub** → toggle **Enabled** → enter:
   - **Client ID** – from [GitHub OAuth Apps](https://github.com/settings/developers)
   - **Client Secret** – from GitHub
   - Save

### OAuth Redirect URLs

In Supabase Dashboard → **Authentication** → **URL Configuration**:
- Add `http://localhost:3000/auth/callback` (for local dev)
- Add `https://your-production-domain.com/auth/callback` (for production)
- Under **Redirect URLs**, add the same URLs

## Step 4: Configure Site URL

In Supabase Dashboard → **Authentication** → **URL Configuration**:
- **Site URL**: `http://localhost:3000` (dev) or your production URL

## Data Architecture

| Table | Purpose | RLS |
|---|---|---|
| `profiles` | User profile info tied to auth.users | User can read/update own |
| `credits` | Credit balance & tier per user | User can read/update own |
| `subscriptions` | Payment subscription records | User can read own; service role manages |
| `conversations` | Chat sessions | User can CRUD own |
| `messages` | Messages within conversations | Via conversation ownership |
| `questions` | Question bank entries | User can CRUD own |
| `exam_results` | Exam attempt history | User can CRUD own |
| `knowledge_entries` | Knowledge base articles | User can CRUD own |
| `wiki_entries` | Personal wiki pages | User can CRUD own |
| `wiki_links` | Wiki graph relationships | Via wiki entry ownership |

## RLS Policy

All tables use Row Level Security. Each user can only access their own data.
The `profiles` table auto-creates a row when a new user signs up (via `handle_new_user()` trigger).
The `credits` table auto-creates a row when a profile is created (via `handle_new_credits()` trigger).

## localStorage Fallback

When Supabase is not configured or the DB is unreachable, the app falls back to localStorage.
This ensures the app works without a backend during development.
