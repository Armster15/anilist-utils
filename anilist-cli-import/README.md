AniList CLI Import
==================

The purpose of this is to seamlessly import your library 
into AniList. Running this program will ask you the name of
the show and when you completed it, and then import it into
AniList. You could use the AniList website to do this, but
I found this program to be much faster than using the website.

For this program to work, an environment variable `TOKEN` must be
set with an AniList user token.

To get your user token:
1. Create an API Client at https://anilist.co/settings/developer
2. Set the Redirect URL of the newly created client to "https://anilist.co/api/v2/oauth/pin?response_type=code"
3. Go to "https://anilist.co/api/v2/oauth/authorize?client_id={client_id}&response_type=code", and make sure
   you replace {client_id} with the actual client ID of your API Client


## Usage
*Requires Python 3 installed*
```bash
git clone https://github.com/Armster15/anilist-utils
cd anilist-utils/anilist-cli-import
pip install -r requirements.txt
python anilist_cli_import.py
```
