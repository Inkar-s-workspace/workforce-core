
-- Role enum
CREATE TYPE public.app_role AS ENUM ('hr', 'department_head');

-- User roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Helper function: check role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Departments
CREATE TABLE public.departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.departments ENABLE ROW LEVEL SECURITY;

-- Employees
CREATE TABLE public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  department_id UUID REFERENCES public.departments(id) ON DELETE SET NULL,
  emp_code TEXT UNIQUE,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  position TEXT,
  is_department_head BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Attendance records
CREATE TABLE public.attendance_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  clock_in TIMESTAMPTZ,
  clock_out TIMESTAMPTZ,
  missed_clock_in BOOLEAN DEFAULT false,
  missed_clock_out BOOLEAN DEFAULT false,
  hours_worked NUMERIC(5,2) DEFAULT 0,
  is_overtime BOOLEAN DEFAULT false,
  overtime_approved BOOLEAN DEFAULT false,
  approved_by UUID REFERENCES public.employees(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, date)
);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

-- Monthly credit balances
CREATE TABLE public.credit_balances (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
  month INT NOT NULL CHECK (month BETWEEN 1 AND 12),
  year INT NOT NULL,
  initial_credit NUMERIC(7,2) DEFAULT 1500,
  deductions NUMERIC(7,2) DEFAULT 0,
  overtime_credits NUMERIC(7,2) DEFAULT 0,
  final_credit NUMERIC(7,2) DEFAULT 1500,
  total_hours_worked NUMERIC(7,2) DEFAULT 0,
  target_hours NUMERIC(7,2) DEFAULT 250,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(employee_id, month, year)
);
ALTER TABLE public.credit_balances ENABLE ROW LEVEL SECURITY;

-- Seed departments
INSERT INTO public.departments (name) VALUES
  ('Administration'),
  ('Allied Health'),
  ('Auxiliary'),
  ('Medicine'),
  ('Nursing & Midwifery'),
  ('Pharmacy');

-- RLS Policies

-- Departments: everyone authenticated can read
CREATE POLICY "Anyone can read departments" ON public.departments FOR SELECT TO authenticated USING (true);
CREATE POLICY "HR can manage departments" ON public.departments FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'hr'));

-- Employees: HR sees all, dept heads see their dept, employees see themselves
CREATE POLICY "HR can manage employees" ON public.employees FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Dept heads can read their dept employees" ON public.employees FOR SELECT TO authenticated
  USING (department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid() AND is_department_head = true));
CREATE POLICY "Employees can read own record" ON public.employees FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Attendance: similar pattern
CREATE POLICY "HR can manage attendance" ON public.attendance_records FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Dept heads can read their dept attendance" ON public.attendance_records FOR SELECT TO authenticated
  USING (employee_id IN (SELECT e.id FROM public.employees e WHERE e.department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid() AND is_department_head = true)));
CREATE POLICY "Dept heads can update their dept attendance" ON public.attendance_records FOR UPDATE TO authenticated
  USING (employee_id IN (SELECT e.id FROM public.employees e WHERE e.department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid() AND is_department_head = true)));

-- Credits: similar pattern
CREATE POLICY "HR can manage credits" ON public.credit_balances FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Dept heads can read their dept credits" ON public.credit_balances FOR SELECT TO authenticated
  USING (employee_id IN (SELECT e.id FROM public.employees e WHERE e.department_id IN (SELECT department_id FROM public.employees WHERE user_id = auth.uid() AND is_department_head = true)));

-- User roles: only HR
CREATE POLICY "HR can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'hr'));
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());

-- Updated_at trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON public.employees FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_attendance_updated_at BEFORE UPDATE ON public.attendance_records FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_credits_updated_at BEFORE UPDATE ON public.credit_balances FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
