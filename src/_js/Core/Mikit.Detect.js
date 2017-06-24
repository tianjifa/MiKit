/**
 * @library Mikit Detect
 * @author Mikit
 * @license MIT
 */
(function (Mikit) {
	Mikit.Detect = function () {};

	Mikit.Detect.prototype = {
		isMobile: function () {
			return /(iPhone|iPod|BlackBerry|Android)/.test(navigator.userAgent);
		},
		isDesktop: function () {
			return !/(iPhone|iPod|iPad|BlackBerry|Android)/.test(navigator.userAgent);
		},
		isMobileScreen: function () {
			return ($(window).width() <= 768);
		},
		isTabletScreen: function () {
			return ($(window).width() >= 768 && $(window).width() <= 1024);
		},
		isDesktopScreen: function () {
			return ($(window).width() > 1024);
		}
	};


}(Mikit));