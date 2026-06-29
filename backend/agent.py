# ============================================================
# AgriMind — LangChain Agent
# The brain: receives user input, calls tools, returns plan
# ============================================================
import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq
from langchain_core.tools import tool
from langchain.agents import create_tool_calling_agent, AgentExecutor
from langchain_core.prompts import ChatPromptTemplate

from tools.weather_tool import get_weather_forecast
from tools.crop_tool import recommend_crop
from tools.irrigation_tool import get_irrigation_advice

load_dotenv()

# --- Define tools as LangChain tools ---

@tool
def weather_tool(location: str) -> dict:
    """
    Fetches real-time weather for a city and generates a 30-day forecast.
    Returns temperature, humidity, dominant weather condition, and daily breakdown.
    """
    return get_weather_forecast(location)


@tool
def crop_tool(soil_type: str, avg_temp: float, avg_humidity: float,
              dominant: str, rain_days: int, location: str) -> dict:
    """
    Recommends the best crop to plant based on soil type and weather averages.
    Returns crop name, confidence score, reasoning, and tags.
    """
    weather_summary = {
        "avg_temp":     avg_temp,
        "avg_humidity": avg_humidity,
        "dominant":     dominant,
        "rain_days":    rain_days,
        "location":     location
    }
    return recommend_crop(soil_type, weather_summary)


@tool
def irrigation_tool(avg_temp: float, avg_humidity: float,
                    rain_days: int, crop: str) -> dict:
    """
    Provides irrigation advice based on weather conditions and the recommended crop.
    Returns watering frequency, amount in litres, and practical tips.
    """
    weather_summary = {
        "avg_temp":     avg_temp,
        "avg_humidity": avg_humidity,
        "rain_days":    rain_days
    }
    return get_irrigation_advice(weather_summary, crop)


# --- Build the agent ---

def build_agent():
    llm = ChatGroq(
        model="llama3-8b-8192",   # fast, free Groq model
        temperature=0,
        api_key=os.getenv("GROQ_API_KEY")
    )

    tools = [weather_tool, crop_tool, irrigation_tool]

    prompt = ChatPromptTemplate.from_messages([
        ("system", """You are AgriMind, an expert agricultural AI assistant.
        
Your job is to help farmers decide what to plant and how to manage their land.

When given a location and soil type, you MUST:
1. Call weather_tool to get the 30-day weather forecast
2. Call crop_tool using the weather results + soil type to get crop recommendation  
3. Call irrigation_tool using weather results + recommended crop for irrigation advice
4. Return a structured JSON response with all results combined

Always call all three tools in sequence. Never skip a tool.
Be concise and practical in your reasoning."""),
        ("human", "{input}"),
        ("placeholder", "{agent_scratchpad}")
    ])

    agent = create_tool_calling_agent(llm, tools, prompt)
    return AgentExecutor(agent=agent, tools=tools, verbose=True, max_iterations=6)


# Singleton — build once, reuse across requests
_agent_executor = None

def get_agent():
    global _agent_executor
    if _agent_executor is None:
        _agent_executor = build_agent()
    return _agent_executor
