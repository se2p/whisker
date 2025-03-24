function initTracker(tracker, line, covered, coveredCumulative) {
    if (line in tracker) {
        return;
    }

    tracker[line] = {
        line,
        covered,
        coveredCumulative,
        status: "fail",
        passCount: 0,
    };
}

export function onExecuted(tracker, line, covered, coveredCumulative) {
    initTracker(tracker, line, covered, coveredCumulative);

    tracker[line].status = "fail";

    for (const c of covered) {
        tracker[line].covered.add(c);
        tracker[line].coveredCumulative.add(c);
    }
}

export function onPassed(tracker, line) {
    tracker[line].status = "pass";
    tracker[line].passCount += 1;
}
