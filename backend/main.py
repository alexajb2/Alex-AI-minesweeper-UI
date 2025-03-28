from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Any
import os

app = FastAPI()

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Store retrieved problems in memory
problems = []
results = []

class GenerateRequest(BaseModel):
    difficulty: str
    count: int

class GenerateResponse(BaseModel):
    problems: List[Dict[str, Any]]

class ProcessResponse(BaseModel):
    results: List[Dict[str, Any]]

def difficulty_to_params(difficulty):
    """Fallback function in case you need grid parameters for other logic."""
    if difficulty.lower() == "beginner":
        return {"rows": 8, "cols": 8, "mines": 10}
    elif difficulty.lower() == "intermediate":
        return {"rows": 16, "cols": 16, "mines": 40}
    elif difficulty.lower() == "expert":
        return {"rows": 16, "cols": 30, "mines": 99}
    else:
        return {"rows": 8, "cols": 8, "mines": 10}  # Default to beginner

@app.post("/api/generate", response_model=GenerateResponse)
async def generate_problems(request: GenerateRequest):
    global problems
    problems = []
    
    # Determine the difficulty prefix (e.g., "Beginner")
    difficulty = request.difficulty.lower()
    prefix = difficulty.capitalize()
    
    # Determine the folder in which problem files reside.
    # First, check if a subfolder named like the difficulty exists in Problems.
    base_problems_dir = os.path.join(os.getcwd(), "Problems")
    difficulty_folder = os.path.join(base_problems_dir, prefix)
    if os.path.isdir(difficulty_folder):
        problems_dir = difficulty_folder
    else:
        problems_dir = base_problems_dir

    # List files that start with the difficulty prefix and end with .txt
    file_list = [f for f in os.listdir(problems_dir) if f.startswith(prefix) and f.endswith(".txt")]
    file_list = sorted(file_list)  # Sort files alphabetically (or adjust sort logic as needed)
    selected_files = file_list[:request.count]

    for i, filename in enumerate(selected_files):
        file_path = os.path.join(problems_dir, filename)
        with open(file_path, "r") as f:
            lines = f.readlines()
        # Expect first line: "rows cols" and second line: "startX startY"
        try:
            rows, cols = map(int, lines[0].split())
            start_x, start_y = map(int, lines[1].split())
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Error parsing file {filename}: {e}")
        # Parse remaining lines as the grid
        grid = []
        for line in lines[2:]:
            row = list(map(int, line.strip().split()))
            grid.append(row)
        
        # Construct problem dictionary. Adjust start_x/start_y to 0-indexed if needed.
        problem = {
            "id": i,
            "grid": grid,
            "start_x": start_x - 1,
            "start_y": start_y - 1,
            "rows": rows,
            "cols": cols,
            # "mines": difficulty_to_params(difficulty)["mines"]  # Optionally include extra info
        }
        problems.append(problem)
    
    return {"problems": problems}

@app.post("/api/process", response_model=ProcessResponse)
async def process_problems():
    global problems, results
    results = []
    
    print(f"Processing {len(problems)} problems")  # Explicit logging
    
    if not problems:
        raise HTTPException(status_code=400, detail="No problems to process. Generate problems first.")
    
    for problem in problems:
        try:
            # Create a temporary world file
            temp_file = f"temp_world_{problem['id']}.txt"
            with open(temp_file, "w") as f:
                f.write(f"{problem['rows']} {problem['cols']}\n")
                f.write(f"{problem['start_x'] + 1} {problem['start_y'] + 1}\n")
                
                # Write grid with mines (1) and safe tiles (0)
                for row in reversed(problem['grid']):
                    f.write(" ".join("1" if cell == 1 else "0" for cell in row) + "\n")
            
            # Create world and run AI
            from World import World
            world = World(filename=temp_file, aiType="myai", verbose=False, debug=False)
            outcome = world.run()
            
            # Extract moves from the AI
            moves = []
            for move in world.get_moves():
                move_type = "reveal" if move["action"] == "UNCOVER" else "flag"
                moves.append({
                    "x": move["x"] - 1,  # Adjust to 0-indexed
                    "y": move["y"] - 1,  # Adjust to 0-indexed
                    "type": move_type,
                    "result": move.get("result", "")
                })

            outcome_str = "win" if outcome > 0 else "lose"
            if outcome_str == "lose" and moves:
                if moves[-1]["type"] == "reveal":
                    moves[-1]["type"] = "exploded"
            elif outcome_str == "win" and moves:
                moves.pop()
            
            results.append({
                "id": problem["id"],
                "moves": moves,
                "outcome": outcome_str
            })
            
            if os.path.exists(temp_file):
                os.remove(temp_file)
        
        except Exception as e:
            print(f"Error processing problem {problem['id']}: {e}")
            results.append({
                "id": problem["id"],
                "moves": [],
                "outcome": "error"
            })
    
    print(f"Processed results: {results}")
    return {"results": results}


@app.get("/api/problem/{problem_id}")
async def get_problem(problem_id: int):
    global problems
    for problem in problems:
        if problem["id"] == problem_id:
            return problem
    raise HTTPException(status_code=404, detail="Problem not found")

# Add a method to track moves if not already in the World class.
def get_moves(self):
    return self._World__moves if hasattr(self, "_World__moves") else []

from World import World
World.get_moves = get_moves

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
