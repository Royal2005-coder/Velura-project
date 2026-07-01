export function initBreadcrumb() {
    var breadcrumbTitle = document.querySelector(".js-breadcrumb-title");
    if (breadcrumbTitle) {
        // Get page name from document title (splitting on typical separators)
        var title = document.title;
        var pageName = title;
        var parts = title.split(/[-–—]/);
        if (parts.length > 0) {
            pageName = parts[0].trim();
        }
        breadcrumbTitle.textContent = pageName;
    }
}
