"""
Flask Todo API
A simple REST API for managing todos with in-memory storage.
No database required - uses Python list for data persistence during runtime.
"""

from flask import Flask, jsonify, request
import uuid  # For generating unique IDs

# Initialize Flask application
app = Flask(__name__)

# In-memory storage for todos
# Each todo is a dictionary with: id, title, description, completed, created_at
todos = []

# Counter for generating unique IDs
todo_id_counter = 1


@app.route('/todos', methods=['GET'])
def get_todos():
    """
    GET /todos - Get all todos
    
    Returns:
        JSON response with all todos
    """
    return jsonify({
        'success': True,
        'data': todos,
        'count': len(todos)
    })


@app.route('/todos/<int:todo_id>', methods=['GET'])
def get_todo(todo_id):
    """
    GET /todos/<id> - Get one todo by ID
    
    Args:
        todo_id (int): The ID of the todo to retrieve
    
    Returns:
        JSON response with the requested todo or error message
    """
    # Find todo by ID
    todo = next((t for t in todos if t['id'] == todo_id), None)
    
    if todo:
        return jsonify({
            'success': True,
            'data': todo
        })
    else:
        return jsonify({
            'success': False,
            'message': f'Todo with id {todo_id} not found'
        }), 404


@app.route('/todos', methods=['POST'])
def create_todo():
    """
    POST /todos - Create a new todo
    
    Expected JSON payload:
        {
            "title": "Todo title (required)",
            "description": "Todo description (optional)",
            "completed": false (optional, defaults to False)
        }
    
    Returns:
        JSON response with the created todo
    """
    global todo_id_counter
    
    # Get JSON data from request
    data = request.get_json()
    
    # Validate required fields
    if not data or not data.get('title'):
        return jsonify({
            'success': False,
            'message': 'Title is required'
        }), 400
    
    # Create new todo
    new_todo = {
        'id': todo_id_counter,
        'title': data['title'],
        'description': data.get('description', ''),
        'completed': data.get('completed', False),
        'created_at': '2024-01-01T00:00:00Z'  # Simple timestamp
    }
    
    # Add to in-memory storage
    todos.append(new_todo)
    todo_id_counter += 1
    
    return jsonify({
        'success': True,
        'message': 'Todo created successfully',
        'data': new_todo
    }), 201


@app.route('/todos/<int:todo_id>', methods=['PUT'])
def update_todo(todo_id):
    """
    PUT /todos/<id> - Update an existing todo
    
    Args:
        todo_id (int): The ID of the todo to update
    
    Expected JSON payload:
        {
            "title": "Updated title (optional)",
            "description": "Updated description (optional)",
            "completed": true/false (optional)
        }
    
    Returns:
        JSON response with the updated todo or error message
    """
    # Find todo by ID
    todo = next((t for t in todos if t['id'] == todo_id), None)
    
    if not todo:
        return jsonify({
            'success': False,
            'message': f'Todo with id {todo_id} not found'
        }), 404
    
    # Get JSON data from request
    data = request.get_json()
    
    if not data:
        return jsonify({
            'success': False,
            'message': 'No data provided for update'
        }), 400
    
    # Update fields if provided
    if 'title' in data:
        todo['title'] = data['title']
    if 'description' in data:
        todo['description'] = data['description']
    if 'completed' in data:
        todo['completed'] = data['completed']
    
    return jsonify({
        'success': True,
        'message': 'Todo updated successfully',
        'data': todo
    })


@app.route('/todos/<int:todo_id>', methods=['DELETE'])
def delete_todo(todo_id):
    """
    DELETE /todos/<id> - Delete a todo by ID
    
    Args:
        todo_id (int): The ID of the todo to delete
    
    Returns:
        JSON response with success message or error message
    """
    # Find todo index by ID
    todo_index = next((i for i, t in enumerate(todos) if t['id'] == todo_id), None)
    
    if todo_index is not None:
        # Remove todo from list
        deleted_todo = todos.pop(todo_index)
        return jsonify({
            'success': True,
            'message': 'Todo deleted successfully',
            'data': deleted_todo
        })
    else:
        return jsonify({
            'success': False,
            'message': f'Todo with id {todo_id} not found'
        }), 404


@app.errorhandler(404)
def not_found(error):
    """Handle 404 errors for undefined routes"""
    return jsonify({
        'success': False,
        'message': 'Endpoint not found'
    }), 404


@app.errorhandler(500)
def internal_error(error):
    """Handle internal server errors"""
    return jsonify({
        'success': False,
        'message': 'Internal server error'
    }), 500


if __name__ == '__main__':
    """
    Main entry point for the Flask application
    """
    print("Starting Flask Todo API...")
    print("Available endpoints:")
    print("  GET    /todos       - Get all todos")
    print("  GET    /todos/<id>  - Get specific todo")
    print("  POST   /todos       - Create new todo")
    print("  PUT    /todos/<id>  - Update todo")
    print("  DELETE /todos/<id>  - Delete todo")
    print("\nAPI will be available at: http://localhost:5000")
    
    # Run the Flask development server
    app.run(debug=True, host='0.0.0.0', port=5000)
