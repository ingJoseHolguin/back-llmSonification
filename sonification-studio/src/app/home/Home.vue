<template>
    <Page>
        <h1>Highcharts Sonification Studio</h1>
        <div class="section intro">
            Highcharts has teamed up with the Sonification Lab at Georgia Institute of Technology to bring you a free tool for exploring audio charts and sonification - using sound to visualize data.
        </div>
        <div class="section to-app">
            <img
                :src="appThumb"
                :class="{ preload }"
                alt=""
                @load="onimgload"
            >
            <router-link
                v-slot="{ navigate }"
                class="go-link"
                to="/app"
                custom
            >
                <a
                    href="#"
                    class="overlay"
                    @click="navigate"
                    @keydown.space="navigate"
                >
                    <div class="go-btn">
                        Go to app
                    </div>
                </a>
            </router-link>
        </div>
        <div class="section more-info">
            <div class="background-section">
                <h2 id="background">
                    <img
                        :src="chartIcon"
                        alt=""
                    >
                    Background
                </h2>
                <p>
                    The Sonification Lab at Georgia Institute of Technology has been a pioneer of sonification research for years, and were the original authors of a tool called the <a href="http://sonify.psych.gatech.edu/research/sonification_sandbox/">Sonification Sandbox</a>. This new Sonification Studio collaboration is an attempt at bringing together the learnings from Georgia Tech's Sonification Sandbox with Highcharts' modern web-based <a href="https://www.highcharts.com">charting and sonification technology</a>, resulting in a more flexible and robust tool for exploration of audio charts.
                </p>
            </div>
            <div class="goals-pricing">
                <h2 id="goals-and-pricing">
                    Goals and pricing
                </h2>
                <p>
                    The goal of this tool is to provide a simple, intuitive, and accessible way for users to import their data, edit it, visualize it, sonify it, and export the results to a useful format. We want users to be able to use the tool without having to write code, and without prior sonification expertise.
                </p>
                <p>Highcharts Sonification Studio is free to use, and no login is required.</p>
                <p>The tool - excluding its code dependencies - is open sourced under the <a href="https://opensource.org/licenses/BSD-3-Clause">BSD 3-clause license</a> to allow for extensions and forks from the community, and ensure the tool remains available to all. An appropriate <a href="https://www.highcharts.com">Highcharts license</a> is required for commercial forks or distribution of the tool. See <a href="https://github.com/highcharts/sonification-studio/blob/master/LICENSE.md">HSS License</a> for more details.</p>
            </div>
            <div class="tutorial-section">
                <h2 id="tutorials">
                    <img
                        :src="tutorialIcon"
                        alt=""
                    >
                    How to use
                </h2>
                <p>
                    We strive to keep the tool easy to use. For detailed instructions, visit our
                    <router-link to="tutorial">
                        tutorial page
                    </router-link>. Please let us know if you
                    have questions or require assistance, and we will be happy to help.
                </p>
                <p>
                    Georgia Institute of Technology also maintains a <a href="https://hss-tutorials.github.io/">community page with tutorials</a> for the tool, and we encourage you to visit that page for more in-depth information.
                    There is also an accompanying <a href="https://www.youtube.com/@HSS-Tutorials">YouTube channel</a> with video tutorials.
                </p>
            </div>
            <div>
                <h2>
                    <img
                        :src="chartIcon"
                        alt=""
                    >
                    Advanced use
                </h2>
                <p>
                    For more advanced audio charts for programmers, try out <a href="https://www.highcharts.com">Highcharts</a>, the underlying technology used to build this tool. Highcharts supports <a href="https://www.highcharts.com/docs/sonification/getting-started">more advanced</a> features and use cases than what we are able to make available in this tool.
                </p>
            </div>
            <div class="development-section">
                <h2 id="development">
                    <img
                        :src="codeIcon"
                        alt=""
                    >
                    Development
                </h2>
                <p>
                    The tool is still in active development, and functionality is subject to change. Project files from the current version are not guaranteed to work with future versions, although we will strive to keep backwards compatibility as we add features. Please get in touch should you have trouble loading an old project file, as we may be able to help.
                </p>
                <p>
                    Please visit the <a href="https://github.com/highcharts/sonification-studio">GitHub repository</a> for the tool to make contributions, log issues, or fork the code to make your own version.
                </p>
                <div>
                    <h3 id="known-issues">
                        Known issues:
                    </h3>
                    <ul>
                        <li>The data grid component has multiple usability issues, especially for screen reader users. This grid is a 3rd party component and will be replaced.</li>
                        <li>Some browsers can have issues with exporting video and audio, and the supported export formats are limited. You may want to use your own screen-recording sofware to work around this, depending on your use case.</li>
                    </ul>
                    <p>For an up-to-date detailed overview of known issues, visit our <a href="https://github.com/highcharts/sonification-studio/issues">GitHub issues</a> page.</p>

                    <h3 id="planned-features">
                        Planned features:
                    </h3>
                    <ul>
                        <li>Implement our own, accessible, data grid.</li>
                        <li>Better sonification navigation for screen reader users.</li>
                        <li>Drag playback slider to scrub.</li>
                        <li>Series-specific sonification contexts and notifications.</li>
                        <li>More chart types.</li>
                        <li>Installable progressive webapp-version, possibly a desktop application version.</li>
                    </ul>
                    <p>If you have requests for features not listed here, please get in touch with us.</p>
                </div>
            </div>
            <h2 id="feedback">
                <img
                    :src="feedbackIcon"
                    alt=""
                >
                Feedback
            </h2>
            <p>
                We would love to hear about your experiences with the tool, as well as thoughts you might have on the direction we are taking. To get involved, please do not hesitate to contact us.
            </p>
            <p>
                <span ref="deferContentA">&nbsp;</span>
                <a ref="deferContentB">&nbsp;</a><span ref="deferContentC">&nbsp;</span>
            </p>
            <p>
                Our public <a href="https://github.com/highcharts/sonification-studio">GitHub repository</a> for the tool supports logging issues, as well as pull requests for contributions. It is also possible to fork the code and make your own customized version. Please note the licensing requirements for commercial use.
            </p>
            <p>
                You can also write a post in the <a href="https://www.highcharts.com/forum/viewtopic.php?f=9&t=46101">Highcharts Sonification Studio feedback thread</a> in our public support forum, which we monitor regularly. Note that you will have to register for a free user account in order to post messages in the forum.
            </p>
        </div>
    </Page>
</template>

<script lang="ts">
import Page from './Page.vue';
import appThumb from './app-thumbnail.png';
import codeIcon from './code-solid.svg';
import chartIcon from './chart-bar-regular.svg';
import feedbackIcon from './comments-regular.svg';
import tutorialIcon from './tutorial-icon.svg';

export default {
    components: {
        Page
    },
    data() {
        return { appThumb, codeIcon, feedbackIcon, chartIcon, tutorialIcon, preload: true };
    },
    mounted() {
        // Add email after DOM loaded to prevent some spam
        setTimeout(() => {
            (this.$refs.deferContentA as any).innerHTML = 'You can send us an email directly at ';
            const deferredB = (this.$refs.deferContentB as any);
            const a = 'mail';
            const b = 'to:accessibility';
            const c = '@highsof';
            const d = 't.com';
            deferredB.setAttribute('href', [a, b, c, d].join(''));
            const e = 'accessibility';
            const f = '@highso';
            const g = 'ft.com';
            deferredB.innerHTML = [e, f, g].join('');
            (this.$refs.deferContentC as any).innerHTML = ', and we will get back to you.';
        }, 800);
    },
    methods: {
        onimgload() {
            setTimeout(() => this.preload = false, 1);
        }
    }
};
</script>

<style lang="less" scoped>
    .intro {
        font-size: 1.2em;
    }

    .to-app {
        margin-top: 50px;
        margin-bottom: 0;
        text-align: center;
        box-sizing: border-box;
        position: relative;
        img {
            width: 100%;
            height: auto;
            opacity: 1;
            transition: opacity 0.5s;
            margin: 0 auto;
            box-sizing: border-box;
            filter: blur(2.5px);
            padding: 5px;
            &.preload {
                height: 557px;
                opacity: 0;
            }
        }
        .overlay {
            position: absolute;
            background-color: rgba(255, 255, 255, 0.4);
            left: 0;
            top: 0;
            right: 0;
            bottom: 0;
            display: flex;
            justify-content: center;
            align-items: center;
            transition: all 0.2s;
            text-decoration: none;
            &:focus {
                .go-btn {
                    border: 3px solid #eb4034;
                }
            }
            &:active {
                .go-btn {
                    border: none;
                }
            }
        }
        .go-btn {
            transition: all 0.1s;
            background-color: #25386f;
            border: 1px solid #25386f;
            color: #ffffff;
            padding: 20px 30px;
            border-radius: 14px;
            font-size: 1.2em;
            font-weight: bold;
            box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
        }
        &:hover {
            .go-btn {
                padding: 22px 32px;
                font-size: 1.25em;
                box-shadow: 0 0 11px rgba(0, 0, 0, 0.5);
            }
            .overlay {
                background-color: rgba(255, 255, 255, 0.5);
            }
        }
    }

    #background {
        margin-top: 40px;
    }

    .more-info {
        margin-top: 0;
        max-width: 50rem;
        a {
            color: #1673B1;
            text-decoration: underline;
            &:hover {
                color: #063AA1;
            }
            &:visited {
                color: #974cb4;
            }
        }
        ul {
            margin-left: 30px;
        }
        h2 {
            color: #25386f;
            margin: 60px 0 20px;
            font-size: 2em;
            font-weight: 700;
            width: 100%;
            text-align: center;
        }
        h3 {
            color: #182650;
            font-size: 1.5em;
            font-weight: 400;
            margin: 30px 0 18px;
        }
        p {
            margin-top: 10px;
        }
        img {
            height: 1em;
            width: auto;
            margin-right: 5px;
            vertical-align: middle;
            margin-top: -5px;
            margin-left: -10px;
        }
    }

    .goals-pricing {
        box-shadow: 0 0 10px rgba(0, 0, 0, 0.4);
        background-color: #47475c;
        color: #fff;
        padding: 30px 20px;
        margin: 60px 0;
        h2 {
            color: #fff;
            margin-top: 0;
        }
        a {
            color: #fff;
            text-decoration: underline;
            &:hover {
                color: #c9e7f7;
            }
            &:visited {
                color: #fff;
            }
        }
    }
</style>
