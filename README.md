# Resources-Dashboard
# Correr el backend
cd backend
python -m venv env    /// python3 -m env venv
.\env\Scripts\activate ////  source venv/bin/activate


pip install -r requirements.txt     

uvicorn main:app --host 0.0.0.0 --port 8000 --reload


# Correr el frontend 
cd frontend
cd resources-dashboard
npm i
npm run dev
