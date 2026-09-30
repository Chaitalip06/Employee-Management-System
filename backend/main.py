from fastapi import FastAPI

app = FastAPI()


@app.get("/")
def home():
    return {
        "message": "Employee Management System Backend is Running!"
    }


@app.get("/api/test")
def test():
    return {
        "success": True,
        "message": "FastAPI backend connected successfully!"
    }