import os
import sys

sys.stdout.reconfigure(encoding='utf-8')

def print_structure(directory, prefix=""):
    items = os.listdir(directory)
    for index, item in enumerate(sorted(items)):
        path = os.path.join(directory, item)
        is_last = index == len(items) - 1
        connector = "└── " if is_last else "├── "
        print(prefix + connector + item)
        if os.path.isdir(path):
            new_prefix = prefix + ("    " if is_last else "│   ")
            if item not in ["node_modules", "Problems", ".venv", ".next", ".git"]:
                print_structure(path, new_prefix)

if __name__ == "__main__":
    current_dir = os.path.basename(os.getcwd())
    print(current_dir)
    print_structure(os.getcwd())
