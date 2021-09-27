const header = `<div id="scroll-background">
            <a id="link">
                <img id="small-logo" class="hide" alt="Whisker Icon" src=""/>
            </a>
            <!-- Toggles -->
            <div class="btn-group-toggle">
                <!-- Tap output toggle -->
                <span class="toggleWrapper">
                    <label class="switch" data-i18n="[title]header:t-tap"
                           data-toggle="tooltip" data-placement="top" data-animation="false">
                        <input id="toggle-tap" class="checkbox-button" type="checkbox" autocomplete="off">
                        <span class="slider round"></span>
                    </label>
                </span>
                <span data-i18n="header:tap"></span>
                <!-- Log toggle -->
                <span class="toggleWrapper">
                <label class="switch" data-i18n="[title]header:t-log"
                       data-toggle="tooltip" data-placement="top" data-animation="false">
                    <input id="toggle-log" class="checkbox-button" type="checkbox" autocomplete="off">
                    <span class="slider round"></span>
                </label>
            </span>
                <span data-i18n="header:log"></span>
                <!-- Test generation toggle -->
                <span class="toggleWrapper">
                    <label class="switch" data-i18n="[title]header:show-advanced"
                           data-toggle="tooltip" data-placement="top" data-animation="false">
                        <input id="toggle-advanced" class="checkbox-button" type="checkbox" autocomplete="off">
                        <span class="slider round"></span>
                    </label>
                </span>
                <span data-i18n="header:advanced"></span>
            </div>
            <!-- Language selector -->
            <div class="links">
                <form id="form-lang"></form>
            </div>
        </div>`;


window.addEventListener('DOMContentLoaded', () => {
    let headerContent = document.querySelector('div[role="navigation"]');
    headerContent.innerHTML = header;
});
