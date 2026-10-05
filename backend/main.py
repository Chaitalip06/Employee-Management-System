from fastapi import FastAPI

app = FastAPI()


# Home API
@app.get("/")
def home():
    return {
        "message": "Employee Management System Backend is Running!"
    }


# Test API
@app.get("/api/test")
def test():
    return {
        "success": True,
        "message": "FastAPI backend connected successfully!"
    }


# Get Employees
@app.get("/api/employees")
def get_employees():
    employees = [
        {
            "id": 1,
            "name": "Chaitali",
            "role": "Software Developer",
            "department": "IT"
        },
        {
            "id": 2,
            "name": "Rahul",
            "role": "Frontend Developer",
            "department": "IT"
        }
    ]

    return {
        "success": True,
        "employees": employees
    }


# Get Single Employee
@app.get("/api/employees/{employee_id}")
def get_employee(employee_id: int):
    return {
        "success": True,
        "employee_id": employee_id,
        "message": f"Employee {employee_id} found"
    }