-- Remove the dangerous public access policy
DROP POLICY IF EXISTS "Allow public access for authentication" ON public.users;

-- Create a secure policy that prevents direct access to user credentials
CREATE POLICY "Users cannot directly access credentials" 
ON public.users 
FOR ALL 
USING (false);