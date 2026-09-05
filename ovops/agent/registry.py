import inspect
import json
from typing import Callable, Dict, Any, List, get_type_hints

# 全局工具注册表
TOOL_REGISTRY: Dict[str, Callable] = {}
TOOL_SCHEMAS: List[Dict[str, Any]] = []

def python_type_to_json_type(py_type) -> str:
    if py_type in (int, float):
        return "number"
    if py_type is bool:
        return "boolean"
    if py_type is str:
        return "string"
    if py_type in (list, List):
        return "array"
    if py_type in (dict, Dict):
        return "object"
    return "string"

def tool(func: Callable):
    """自研轻量 @tool 装饰器：将普通 Python 函数转化为大模型原生 Tool-Calling Schema"""
    name = func.__name__
    doc = func.__doc__ or "无工具描述"
    
    # 解析函数入参注解
    hints = get_type_hints(func)
    sig = inspect.signature(func)
    
    properties = {}
    required = []
    
    for param_name, param in sig.parameters.items():
        if param_name == "return":
            continue
        param_type = hints.get(param_name, str)
        properties[param_name] = {
            "type": python_type_to_json_type(param_type),
            "description": f"参数 {param_name}"
        }
        if param.default == inspect.Parameter.empty:
            required.append(param_name)
            
    schema = {
        "type": "function",
        "function": {
            "name": name,
            "description": doc.strip(),
            "parameters": {
                "type": "object",
                "properties": properties,
                "required": required
            }
        }
    }
    
    TOOL_REGISTRY[name] = func
    TOOL_SCHEMAS.append(schema)
    func.tool_schema = schema
    return func

def get_all_tool_schemas() -> List[Dict[str, Any]]:
    return TOOL_SCHEMAS

async def execute_tool(name: str, arguments: Dict[str, Any]) -> Any:
    if name not in TOOL_REGISTRY:
        return {"error": f"Tool '{name}' 未在注册表中找到"}
    func = TOOL_REGISTRY[name]
    try:
        if inspect.iscoroutinefunction(func):
            return await func(**arguments)
        else:
            return func(**arguments)
    except Exception as e:
        return {"error": f"执行工具 '{name}' 异常: {str(e)}"}
