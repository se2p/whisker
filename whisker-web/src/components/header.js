const header = `<div id="scroll-background">
            <a id="link">
                <img id="small-logo" class="hide" alt="Whisker Icon" src=""/>
            </a>
            <!-- Navigation -->
            <!-- Currently disabled as it is the only navigation item as long as faq/demo is disabled. Logo has the functionality now.
                <ul id="nav-links" class="nav justify-content-center">
                    <li class="nav-item">
                        <a id="link" class="nav-link active" href="index.html" data-i18n="project-link"></a>
                    </li>
                    <li class="nav-item">
                        <a id="faq" class="nav-link" href="./faq.html" data-i18n="faq"></a>
                    </li>
                </ul>
            -->
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
                <span data-i18n="header:tap" class="toggleDescription"></span>
                <!-- Log toggle -->
                <span class="toggleWrapper">
                <label class="switch" data-i18n="[title]header:t-log"
                       data-toggle="tooltip" data-placement="top" data-animation="false">
                    <input id="toggle-log" class="checkbox-button" type="checkbox" autocomplete="off">
                    <span class="slider round"></span>
                </label>
                </span>
                <span data-i18n="header:log" class="toggleDescription"></span>
                <!-- Test generation toggle -->
                <span class="toggleWrapper">
                    <label class="switch" data-i18n="[title]header:show-advanced"
                           data-toggle="tooltip" data-placement="top" data-animation="false">
                        <input id="toggle-advanced" class="checkbox-button" type="checkbox" autocomplete="off">
                        <span class="slider round"></span>
                    </label>
                </span>
                <span data-i18n="header:advanced" class="toggleDescription"></span>
                <!-- Test editor toggle -->
                <span class="toggleWrapper">
                     <label class="switch">
                         <input id="toggle-test-editor" class="checkbox-button" type="checkbox" autocomplete="off">
                         <span class="slider round"></span>
                     </label>
                </span>
                <span data-i18n="header:test-editor" class="toggleDescription"></span>
                <!-- Model editor toggle -->
                <span class="toggleWrapper">
                     <label class="switch">
                         <input id="toggle-model-editor" class="checkbox-button" type="checkbox" autocomplete="off">
                         <span class="slider round"></span>
                     </label>
                </span>
                <span data-i18n="modelEditor:title" class="toggleDescription"></span>
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
