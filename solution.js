function setTargetAndRefresh() {
    window.googletag = window.googletag || {};
    window.googletag.cmd = window.googletag.cmd || [];
    window.googletag.cmd.push(function() {
        window.googletag.pubads().setTargeting("permutive", "gaming");
        googletag.pubads().refresh();
    });

}

function roundToNearest(value, interval) {
    return Math.round(value / interval) * interval;
}

// Exercise 4: As played property is optional it's not entirely clear whether  played event property should be precisely at 0.25,0.5,0.75,1 or rounded to the nearest interval value.
// Below implementation nears to the interval. 

function processVideoPlayerState(eventName, state) {
    var options = {}
    options.eventName = eventName;
    options.played = roundToNearest(state.videoTime / state.videoDuration, 0.25);
    options.videoId = state.videoId;
    options.adAdvertiserName = state.adAdvertiserName;
    options.adDuration = state.adDuration;
    options.videoDuration = state.videoDuration;
    options.adPosition = state.adPosition;
    options.adIsSkippable = state.adIsSkippable;
    options.playerIsViewable = state.playerIsViewable;
    options.playerIsMuted = state.playerIsMuted;
    options.adTitle = state.adTitle;
    options.videoTitle = state.videoTitle;
    options.adId = state.adId;
    options.adEndedReason = state.adEndedReason;
    //console.log("Received  an event:",eventName, "Current state is:", state, "options values are",options);
    permutive.track('DailymotionState', options, callback)

}


var callback = {
    success: function(event) {
        console.log("Tracked a new " + event.name + "event.");
    },
    error: function(errors) {}
}

// exercise 2

// assuming scrolling has to be fired  only once;
// if the event needs to be fired on repeat move below declaration inside the checkBreakpoint function

var breakpoints = [25, 50, 75, 100];

function checkBreakpoint(event) {
    var h = document.documentElement,
        b = document.body,
        st = 'scrollTop',
        sh = 'scrollHeight';


    var percent = Math.ceil((h[st] || b[st]) / ((h[sh] || b[sh]) - h.clientHeight) * 100);

    var index = breakpoints.indexOf(percent);

    // If the percentage is defined in breakpoints or the closest (lower) breakpoint has been reached
    if (index >= 0) {

        // (:
        console.log(percent + '% reached!');

        var options = {
            'scroll_depth': percent
        }
        permutive.track('Scroll', options, callback);

        // Removes th breakpoint goal
        breakpoints.splice(index, 1);

        // If no more goals to achieve, remove the event
        if (breakpoints.length == 0) {
            window.removeEventListener('scroll', checkBreakpoint);
        }

    }
}

document.addEventListener("scroll", checkBreakpoint, false);


// exercises 1,3

document.addEventListener("DOMContentLoaded", (event) => {
    //console.log("DOM fully loaded and parsed");
    //here we will assume only 1 div block with article-page class exists
    var article_page = document.getElementsByClassName('article-page')[0];
    if (article_page) {
        //here we are also assuming there is only one h2 and h3/b tags and they contain information we need
        var title = article_page.getElementsByTagName('h2')[0].innerHTML;
        var author = article_page.getElementsByTagName('h3')[0].getElementsByTagName('b')[0].innerHTML;
        var categories = document.querySelectorAll('meta[name="categories"]')[0].getAttribute('content').split(',');
        var callback = {
            success: function(event) {
                console.log("Tracked a new " + event.name + "event.");
            },
            error: function(errors) {}
        }

        var options = {}

        //probably would have been a good idea to do regex check on data 

        if (author) {
            options.author = author
        }
        if (title) {
            options.title = title
        }
        if (categories.length > 0 && categories[0] != '') {
            options.categories = categories
        }

        permutive.track('Pageview', options, callback);

        // here we capture a case when a new user moves into the segment
        permutive.trigger(6912, "result", function(obj) {
            if (obj.result) {
                //console.log('a user has moved into the game segment');
                setTargetAndRefresh()
            }
        });
        // here we capture a case when a user is already in the segment
        permutive.segment(6912, function(result) {
            if (result) {
                //console.log('a user is already in the game segment');
                setTargetAndRefresh();
            } else {
                //console.log('a user is not yet in the game segment');
            }
        });
    }

    //exercise 4

    dailymotion.createPlayer('myPlayer', {
        video: 'x6feo7b',
    });

    playerPromise = dailymotion.getPlayer();

    playerPromise.then((player) => {
        statePromise = player.getState();
        statePromise.then((state) => {
            player.on(dailymotion.events.PLAYER_START, processVideoPlayerState.bind(state, "PLAYER_START"));
            player.on(dailymotion.events.VIDEO_PLAY, processVideoPlayerState.bind(state, "VIDEO_PLAY"));
            player.on(dailymotion.events.VIDEO_PAUSE, processVideoPlayerState.bind(state, "VIDEO_PAUSE"));
            player.on(dailymotion.events.VIDEO_START, processVideoPlayerState.bind(state, "VIDEO_START"));
            player.on(dailymotion.events.AD_START, processVideoPlayerState.bind(state, "AD_START"));
            player.on(dailymotion.events.AD_START, processVideoPlayerState.bind(state, "AD_PLAY"));
            player.on(dailymotion.events.AD_PAUSE, processVideoPlayerState.bind(state, "AD_PAUSE"));
            player.on(dailymotion.events.AD_PAUSE, processVideoPlayerState.bind(state, "AD_CLICK"));
        })
    });

});
