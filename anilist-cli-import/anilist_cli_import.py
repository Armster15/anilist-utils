from typing import List, Dict, TypedDict
from gql import gql, Client
from gql.transport.aiohttp import AIOHTTPTransport

import os
from dotenv import load_dotenv

load_dotenv()

months_to_nos = {
    "January": 1,
    "February": 2,
    "Feb": 2,
    "March": 3,
    "April": 4,
    "May": 5,
    "June": 6,
    "July": 7,
    "August": 8,
    "September": 9,
    "October": 10,
    "November": 11,
    "December": 12
}

# Select your transport with a defined url endpoint
token = os.getenv("TOKEN")
transport_auth = AIOHTTPTransport(url="https://graphql.anilist.co/", headers={'Authorization': f'Bearer {token}'})
transport_noauth = AIOHTTPTransport(url="https://graphql.anilist.co/")

# Create a GraphQL client using the defined transport
client_auth = Client(transport=transport_auth, fetch_schema_from_transport=True)
client_noauth = Client(transport=transport_noauth, fetch_schema_from_transport=True)

# Provide a GraphQL query

class RawShow__Title(TypedDict):
    english: str;
    romaji: str;
class RawShow(TypedDict):
    title: RawShow__Title
    id: int

def search(name: str) -> List[RawShow]:
    result = client_noauth.execute(gql(
        f"""
        query {{
            Page(page: 1) {{
                media(search: "{name}", type: ANIME) {{
                title {{
                    english,
                    romaji
                }},
                id
                }}
            }}
            }}
        """
    ))

    return result["Page"]["media"]

while True:
    print("Name of Show")
    show_name = input()

    if "[ABANDONED]" in show_name:
        status = "DROPPED"
        show_name = show_name.replace("[ABANDONED]", "")
    else:
        status = "COMPLETED"

    shows = search(show_name)

    print("============")
    for index, show in enumerate(shows):
        preferred_title = show["title"]["english"] if show["title"]["english"] is not None else show["title"]["romaji"]
        print(f"[{index}] {preferred_title} ({show['id']})")
    print("============")
    print("Type show number you want")

    actual_show = shows[int(input())]

    print("============")
    print("Start Month Date Year (Format: 'July 16 2021')")
    [start_month, start_day, start_year] = input().split(" ");
    start_month = months_to_nos[start_month] # Convert month name to number (ex: "January" --> 1)

    print("============")
    print("End Month Date Year (Format: 'July 23 2021')")
    [end_month, end_day, end_year] = input().split(" ");
    end_month = months_to_nos[end_month] # Convert month name to number (ex: "January" --> 1)

    result = client_auth.execute(gql(
        f"""
        mutation {{
            SaveMediaListEntry(mediaId: {actual_show["id"]}, status: {status}, startedAt: {{year: {start_year}, month: {start_month}, day: {start_day}}}, completedAt: {{year: {end_year}, month: {end_month}, day: {end_day}}}) {{
                id
            }}
        }}   
        """
    ))
    print(result)

    print("\033[H\033[J", end="") # Clears screen
