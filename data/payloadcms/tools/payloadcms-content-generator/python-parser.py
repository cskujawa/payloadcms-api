import json
import re

# Get the AI Agent output - try different possible field names
ai_output = None
for item in _input.all():
    # Common field names from AI Agent nodes
    if 'output' in item.json:
        ai_output = item.json['output']
        break
    elif 'text' in item.json:
        ai_output = item.json['text']
        break
    elif 'response' in item.json:
        ai_output = item.json['response']
        break
    elif 'content' in item.json:
        ai_output = item.json['content']
        break

if not ai_output:
    # Fallback: get the entire json object
    ai_output = str(item.json)

# Clean the response to extract JSON
def extract_json(text):
    """Extract JSON from potentially messy AI output"""
    
    # Remove markdown code blocks
    text = re.sub(r'```json\s*', '', text)
    text = re.sub(r'```\s*', '', text)
    
    # Remove common wrapper patterns
    text = re.sub(r'^[^{]*', '', text)  # Remove text before first {
    text = re.sub(r'}[^}]*$', '}', text)  # Remove text after last }
    
    # Find JSON object boundaries
    brace_count = 0
    start_idx = text.find('{')
    if start_idx == -1:
        raise ValueError("No JSON object found")
    
    end_idx = start_idx
    for i, char in enumerate(text[start_idx:], start_idx):
        if char == '{':
            brace_count += 1
        elif char == '}':
            brace_count -= 1
            if brace_count == 0:
                end_idx = i
                break
    
    return text[start_idx:end_idx + 1]

# Parse the JSON
try:
    cleaned_json = extract_json(ai_output)
    parsed_data = json.loads(cleaned_json)
except (json.JSONDecodeError, ValueError) as e:
    # If parsing fails, try to fix common issues
    try:
        # Remove extra quotes and clean up
        fixed_json = re.sub(r'"\s*{', '{', cleaned_json)
        fixed_json = re.sub(r'}\s*"', '}', fixed_json)
        parsed_data = json.loads(fixed_json)
    except:
        return [{"error": f"Failed to parse JSON: {str(e)}", "raw_output": ai_output}]

# Validate and ensure required fields exist
def validate_payload_structure(data):
    """Ensure the data matches PayloadCMS requirements"""
    
    result = {}
    
    # Required fields with defaults
    result['title'] = data.get('title', 'Generated Blog Post')
    
    # Meta is required
    if 'meta' not in data or not isinstance(data['meta'], dict):
        result['meta'] = {
            'title': result['title'],
            'description': 'Generated content for PayloadCMS'
        }
    else:
        result['meta'] = {
            'title': data['meta'].get('title', result['title']),
            'description': data['meta'].get('description', 'Generated content for PayloadCMS')
        }
    
    # Blocks are required
    if 'blocks' not in data or not isinstance(data['blocks'], list):
        result['blocks'] = [
            {
                "type": "paragraph",
                "content": "Generated content block"
            }
        ]
    else:
        # Validate each block has required fields
        validated_blocks = []
        for block in data['blocks']:
            if isinstance(block, dict) and 'type' in block and 'content' in block:
                validated_blocks.append(block)
        
        result['blocks'] = validated_blocks if validated_blocks else [
            {
                "type": "paragraph", 
                "content": "Generated content block"
            }
        ]
    
    # Optional fields
    if 'slug' in data:
        result['slug'] = data['slug']
    
    if 'categories' in data and isinstance(data['categories'], list):
        result['categories'] = data['categories']
    
    if 'heroImage' in data:
        result['heroImage'] = bool(data['heroImage'])
    
    return result
 
# Validate and clean the parsed data
try:
    validated_data = validate_payload_structure(parsed_data)
    
    # Return the data for the HTTP Request node
    return [validated_data]
    
except Exception as e:
    return [{"error": f"Validation failed: {str(e)}", "parsed_data": parsed_data}]