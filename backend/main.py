from fastapi import FastAPI
from supabase import create_client, Client
from dotenv import load_dotenv
import os

# Load .env file
load_dotenv()

# Get Supabase credentials
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")

# Check credentials
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL or SUPABASE_KEY is missing in .env file")

# Create Supabase client
supabase: Client = create_client(
    SUPABASE_URL,
    SUPABASE_KEY
)

# Create FastAPI app
app = FastAPI()


# -----------------------------
# HOME API
# -----------------------------
@app.get("/")
def home():
    return {
        "success": True,
        "message": "Employee Management System Backend is Running!"
    }


# -----------------------------
# TEST API
# -----------------------------
@app.get("/api/test")
def test():
    return {
        "success": True,
        "message": "FastAPI backend connected successfully!"
    }


# -----------------------------
# GET ALL EMPLOYEES
# -----------------------------
@app.get("/api/employees")
def get_employees():

    try:
        response = (
            supabase
            .table("employees")
            .select("*")
            .execute()
        )

        return {
            "success": True,
            "employees": response.data
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }


# -----------------------------
# GET SINGLE EMPLOYEE
# -----------------------------
@app.get("/api/employees/{employee_id}")
def get_employee(employee_id: str):

    try:
        response = (
            supabase
            .table("employees")
            .select("*")
            .eq("id", employee_id)
            .execute()
        )

        return {
            "success": True,
            "employee": response.data
        }

    except Exception as e:

        return {
            "success": False,
            "error": str(e)
        }