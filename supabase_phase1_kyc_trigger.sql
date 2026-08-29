-- Create Enum for kyc_status if it doesn't exist
DO $$ BEGIN
    CREATE TYPE kyc_status_enum AS ENUM ('PENDING', 'SUBMITTED', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Ensure public.profiles table exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  username text UNIQUE,
  phone text,
  address text,
  kyc_status kyc_status_enum DEFAULT 'PENDING',
  face_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Ensure RLS is configured appropriately
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public profiles are viewable by everyone."
      ON public.profiles FOR SELECT
      USING ( true );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can insert their own profile."
      ON public.profiles FOR INSERT
      WITH CHECK ( auth.uid() = id );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE POLICY "Users can update own profile."
      ON public.profiles FOR UPDATE
      USING ( auth.uid() = id );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Create Trigger Function
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, username, phone, address, kyc_status, face_verified)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'phone',
    NEW.raw_user_meta_data->>'address',
    'PENDING',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
