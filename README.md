# YouTube Daily Limit - 5Vids

A simple, effective Chrome extension to help you regain control of your YouTube consumption by limiting the *number* of videos you watch per day, not just the time you spend.

## The Problem

Have you ever found yourself falling down a YouTube rabbit hole for hours on end? You start with one video, and before you know it, five hours have passed. Many extensions limit total watch *time*, but what if that time is productive?

This extension was born out of that frustration. I wanted to stop mindless binge-watching while still allowing for focused, productive sessions on YouTube. Instead of a blanket time limit, **5Vids** sets a daily quota on the *quantity* of videos you watch, helping you be more intentional with your viewing choices.

This project was built with the assistance of AI, demonstrating a modern workflow for rapid tool development.

## What It Does

This extension is designed to be a mindful gatekeeper for your YouTube watching habits. When you land on a new YouTube video, an overlay will appear, asking if you want to "count" the video towards your daily limit of five.

### Key Features:

  * **Daily Video Limit:** A hard cap of 5 videos per day to encourage mindful watching.
  * **Interactive Overlay:** When you open a video, a sleek overlay asks for your decision. You have 10 seconds to choose.
      * **Count It (Y):** Adds the video to your daily tally.
      * **Skip (N):** Skips the video and redirects you back to the YouTube homepage. If you don't decide in 10 seconds, it will automatically skip.
  * **Blocking Page:** Once you've reached your limit of 5 videos, any new video you try to watch will redirect to a stylish, custom "Limit Reached" page to remind you to take a break.
  * **Popup Dashboard:** Click the extension icon to open a dashboard with:
      * A progress bar showing your daily consumption.
      * A list of the videos you've watched today, with links to revisit them.
      * The ability to remove a video from the day's count if you added it by mistake.
      * A toggle to enable or disable the extension.
      * A dark/light theme toggle for the popup.
  * **Automatic Reset:** Your video count automatically resets to zero at midnight every day.

## How to Install

Since this is not yet on the Chrome Web Store, you can load it as an unpacked extension:

1.  Download or clone this repository to your local machine.
2.  Open Google Chrome and navigate to `chrome://extensions`.
3.  Turn on **"Developer mode"** using the toggle switch in the top-right corner.
4.  Click the **"Load unpacked"** button that appears.
5.  Select the folder where you saved the extension files.
6.  The "YouTube Daily Limit" extension should now appear in your list of extensions and be active\!

## How to Use

1.  Make sure the extension is enabled (you can check in the popup).
2.  Navigate to a YouTube video page (`youtube.com/watch?...`).
3.  An overlay will appear on the top right.
4.  Press **'Y'** or click **"Count It"** to watch the video and add it to your daily count.
5.  Press **'N'** or click **"Skip"** to be redirected away from the video.
6.  Click the extension icon in your browser toolbar at any time to see your status for the day.

## Future Plans

This extension was built to solve a specific problem and is considered feature-complete for its initial goal. There are no immediate plans for new features, but suggestions and contributions are always welcome\!

## Contributing

Yes, please\! If you find a bug, have a feature request, or want to contribute to the code, feel free to open an issue or a pull request on the GitHub repository.

## License

This project is licensed under the **MIT License**. This is a permissive license that allows for reuse, modification, and distribution, both in private and commercial projects.

```
MIT License

Copyright (c) [Your Name or Year]

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
```
