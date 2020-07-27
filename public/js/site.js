const isLargeScreen = window.matchMedia("(min-width: 768px)").matches;
const searchInput = $('#search');
const dataList = $('#data-list');
const searchResultList = $('#search-result-list');
const noResultsText = $('#text-no-results');
const zoomIn = $('#zoom-in');
const zoomOut = $('#zoom-out');

const scrollableList = $('#scrollable-list');
searchResultList.removeClass('d-none').hide();

const timestamp = $('.timestamp');
timestamp.text(function (_, text) {
    return new Date(text * 1000).toLocaleString('en-MY', {
        day: '2-digit',
        month: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true
    }).toUpperCase();
});
timestamp.removeClass('d-none').show();

searchInput.on('input', function () {
    $('html, body').animate({
        scrollTop: searchInput.offset().top - 20
    }, 300);

    const searchTerm = this.value.trim().toLowerCase();

    if (searchTerm === '') {
        searchResultList.hide();
        dataList.show();
        return;
    }

    let found = false;
    $('.search-result-item').each(function () {
        const e = $(this);
        if (e.text().toLowerCase().indexOf(searchTerm) > -1) {
            found = true;
            e.show();
        } else {
            e.hide();
        }
    })

    dataList.hide();
    (found) ? noResultsText.hide() : noResultsText.show();
    searchResultList.show();
});

const mobilePanZoomEventHandler = {
    haltEventListeners: ['touchstart', 'touchend', 'touchmove', 'touchleave', 'touchcancel'],
    init: function (options) {
        let instance = options.instance, initialScale = 1, pannedX = 0, pannedY = 0;

        // Init Hammer
        // Listen only for pointer and touch events
        this.hammer = new Hammer(options.svgElement, {
            inputClass: Hammer.SUPPORT_POINTER_EVENTS ? Hammer.PointerEventInput : Hammer.TouchInput
        });

        // Enable pinch
        this.hammer.get('pinch').set({enable: true});

        // Handle pan
        this.hammer.on('panstart panmove', function (ev) {
            // On pan start reset panned variables
            if (ev.type === 'panstart') {
                pannedX = 0;
                pannedY = 0;
            }
            // Pan only the difference
            instance.panBy({x: ev.deltaX - pannedX, y: ev.deltaY - pannedY});
            pannedX = ev.deltaX;
            pannedY = ev.deltaY;
        });

        // Handle pinch
        this.hammer.on('pinchstart pinchmove', function (ev) {
            // On pinch start remember initial zoom
            if (ev.type === 'pinchstart') {
                initialScale = instance.getZoom();
                instance.zoomAtPoint(initialScale * ev.scale, {x: ev.center.x, y: ev.center.y});
            }
            instance.zoomAtPoint(initialScale * ev.scale, {x: ev.center.x, y: ev.center.y});
        })
    },
    destroy: function () {
        this.hammer.destroy();
    }
}

const beforePan = function (oldPan, newPan) {
    let stopHorizontal = false,
        stopVertical = false,
        gutterWidth = 100,
        gutterHeight = 300,
        sizes = this.getSizes(),
        leftLimit = -((sizes.viewBox.x + sizes.viewBox.width) * sizes.realZoom) + gutterWidth,
        rightLimit = sizes.width - gutterWidth - (sizes.viewBox.x * sizes.realZoom),
        topLimit = -((sizes.viewBox.y + sizes.viewBox.height) * sizes.realZoom) + gutterHeight,
        bottomLimit = sizes.height - gutterHeight - (sizes.viewBox.y * sizes.realZoom);

    return {
        x: Math.max(leftLimit, Math.min(rightLimit, newPan.x)),
        y: Math.max(topLimit, Math.min(bottomLimit, newPan.y))
    };
}

const onZoom = function (zoomLevel) {
    zoomLevel = Math.round(zoomLevel * 100 + Number.EPSILON) / 100;
    if (zoomLevel >= 8) {
        zoomIn.addClass('disabled');
        zoomOut.removeClass('disabled');
    } else if (zoomLevel <= 0.8) {
        zoomIn.removeClass('disabled');
        zoomOut.addClass('disabled');
    } else {
        zoomIn.removeClass('disabled');
        zoomOut.removeClass('disabled');
    }
}

const mapPanZoom = svgPanZoom('#map', {
    zoomScaleSensitivity: 0.5,
    minZoom: 0.8,
    maxZoom: 8,
    beforePan: beforePan,
    onZoom: onZoom,
    customEventsHandler: mobilePanZoomEventHandler
});

zoomIn.click(function (event) {
    event.preventDefault();
    event.stopPropagation();
    if ($(this).hasClass('disabled')) return;
    mapPanZoom.zoomIn();
});

zoomOut.click(function (event) {
    event.preventDefault();
    event.stopPropagation();
    if ($(this).hasClass('disabled')) return;
    mapPanZoom.zoomOut();
});

$('.collapse').on('shown.bs.collapse', function () {
    scrollableList.animate({
        scrollTop: $(this).prev().offset().top - scrollableList.offset().top + scrollableList.scrollTop()
    }, 200);
});

$('path[data-target]').click(function () {
    $($(this).data('target')).collapse('show');
});

tippy('path[data-name][data-total]', {
    content(reference) {
        const name = reference.getAttribute('data-name');
        const total = reference.getAttribute('data-total');
        return `<div class="pop-up border-top-${(total > 40) ? 'red' : (total > 0) ? 'yellow' : 'green'}">${name}<br>(${(total < 0) ? 'No data available' : `${total} active case${(total === '1') ? '' : 's'}`})</div>`;
    },
    allowHTML: true,
    animation: 'shift-toward-extreme',
    followCursor: isLargeScreen ? 'default' : 'initial',
    hideOnClick: !isLargeScreen,
    trigger: isLargeScreen ? 'mouseenter' : 'click',
    delay: [200, null]
});

$('#map').click(function () {
    searchInput.blur();
});
