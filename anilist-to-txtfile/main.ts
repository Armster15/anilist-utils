import { request, gql } from "graphql-request";
import { uniqBy } from "lodash";
import fs from "fs/promises";
import Prompt from "prompt-sync";

const prompt = Prompt({ sigint: true });

type MediaStatus =
  | "FINISHED"
  | "RELEASING"
  | "NOT_YET_RELEASED"
  | "CANCELLED"
  | "HIATUS";
type MediaListStatus =
  | "CURRENT"
  | "PLANNING"
  | "COMPLETED"
  | "DROPPED"
  | "PAUSED"
  | "REPEATING";

interface Data {
  MediaListCollection: {
    lists: {
      entries: {
        mediaId: number;
        media: {
          title: {
            english: string;
            romaji: string;
          };
          startDate: {
            year: number;
            month: number;
            day: number;
          };
          endDate: {
            year: number;
            month: number;
            day: number;
          };
          status: MediaStatus;
        };
        startedAt: {
          year: number;
          month: number;
          day: number;
        };
        completedAt: {
          year: number;
          month: number;
          day: number;
        };
        status: MediaListStatus;
      }[];
    }[];
  };
}

const NoToMonth: { [key: string]: string } = {
  "1": "January",
  "2": "February",
  "3": "March",
  "4": "April",
  "5": "May",
  "6": "June",
  "7": "July",
  "8": "August",
  "9": "September",
  "10": "October",
  "11": "November",
  "12": "December",
};

const username = prompt("Type in an AniList username: ")

const query = gql`
    query {
        MediaListCollection(userName: "${username}", type: ANIME, sort: STARTED_ON) {
            lists {
                entries {
                    mediaId,
                    media {
                        title {
                            english,
                            romaji
                        }
                        startDate {
                            year
                            month
                            day
                        }
                        endDate {
                            year
                            month
                            day
                        },
                        status
                    }
                    startedAt {
                        year
                        month
                        day
                    }
                    completedAt {
                        year
                        month
                        day
                    }
                    status
                }
            }
        }
    }
`;

(async () => {
  let txt = "";
  const data: Data = await request("https://graphql.anilist.co/", query);
  let _unsorted_shows = data.MediaListCollection.lists
    .map((entry) => entry.entries)
    .flat();

  let _shows = uniqBy(_unsorted_shows, "mediaId");

  let shows = _shows.sort((a, b) => {
    return (
      new Date(a.startedAt.year, a.startedAt.month, a.startedAt.day).valueOf() -
      new Date(b.startedAt.year, b.startedAt.month, b.startedAt.day).valueOf()
    );
  });

  shows.forEach((show) => {
    let title = show.media.title.english ?? show.media.title.romaji;
    let tags: string[] = [];
    let formattedDate: string | undefined = undefined;

    if (show.status === "PLANNING" || show.status === "PAUSED") {
      return;
    }

    if (show.media.status == "RELEASING") {
      tags.push("[SIMULCAST]");
    } else {
      let _userStartedAt = new Date(
        show.startedAt.year,
        show.startedAt.month,
        show.startedAt.day
      ).getTime();
      let _startedAiringAt = new Date(
        show.media.startDate.year,
        show.media.startDate.month,
        show.media.startDate.day
      ).getTime();
      let _finishedAiringAt = new Date(
        show.media.endDate.year,
        show.media.endDate.month,
        show.media.endDate.day
      ).getTime();

      if (
        _userStartedAt >= _startedAiringAt &&
        _userStartedAt <= _finishedAiringAt
      ) {
        tags.push("[SIMULCAST]");
      }
    }

    if (show.status === "DROPPED") {
      tags.push("[ABANDONED]");
    }

    if (
      show.startedAt.day &&
      show.startedAt.month &&
      show.startedAt.year &&
      show.completedAt.day &&
      show.completedAt.month &&
      show.completedAt.year
    ) {
      if (JSON.stringify(show.startedAt) === JSON.stringify(show.completedAt)) {
        formattedDate = `<-- ${NoToMonth[String(show.startedAt.month)]} ${
          show.startedAt.day
        }, ${show.startedAt.year}`;
      }

      // If month is same do like January 13-20, 2022
      // (also I added a check to make sure the year is the same)
      else if (
        show.startedAt.month === show.completedAt.month &&
        show.startedAt.year === show.completedAt.year
      ) {
        formattedDate = `<-- ${NoToMonth[String(show.startedAt.month)]} ${
          show.startedAt.day
        }-${show.completedAt.day}, ${show.startedAt.year}`;
      }

      // Month is not the same but the year is
      else if (show.startedAt.year === show.completedAt.year) {
        formattedDate = `<-- ${NoToMonth[String(show.startedAt.month)]} ${
          show.startedAt.day
        }-${NoToMonth[String(show.completedAt.month)]} ${
          show.completedAt.day
        }, ${show.startedAt.year}`;
      } else {
        formattedDate = `<-- ${NoToMonth[String(show.startedAt.month)]} ${
          show.startedAt.day
        }, ${show.startedAt.year}-${
          NoToMonth[String(show.completedAt.month)]
        } ${show.completedAt.day}, ${show.completedAt.year}`;
      }
    } else if (
      show.startedAt.day &&
      show.startedAt.month &&
      show.startedAt.year
    ) {
      formattedDate = `<-- ${NoToMonth[String(show.startedAt.month)]} ${
        show.startedAt.day
      }-, ${show.startedAt.year}`;
    }

    txt += [title, tags.length > 0 ? tags.join(" ") : undefined, formattedDate]
      .filter((e) => e)
      .join(" ");

    txt += "\n";
  });

  await fs.writeFile("gen.txt", txt);
})();
