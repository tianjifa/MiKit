/**
 * @library Mikit Utils
 * @author Mikit
 * @license MIT
 */
(function (Mikit) {
	Mikit.Utils = function () {};

	Mikit.Utils.prototype = {
		disableBodyScroll: function () {
			var $body = $('body');
			var windowWidth = window.innerWidth;

			if (!windowWidth) {
				var documentElementRect = document.documentElement.getBoundingClientRect();
				windowWidth = documentElementRect.right - Math.abs(documentElementRect.left);
			}

			var isOverflowing = document.body.clientWidth < windowWidth;
			var scrollbarWidth = this.measureScrollbar();

			$body.css('overflow', 'hidden');
			if (isOverflowing) $body.css('padding-right', scrollbarWidth);
		},
		measureScrollbar: function () {
			var $body = $('body');
			var scrollDiv = document.createElement('div');
			scrollDiv.className = 'mi-scrollbar-measure';

			$body.append(scrollDiv);
			var scrollbarWidth = scrollDiv.offsetWidth - scrollDiv.clientWidth;
			$body[0].removeChild(scrollDiv);
			return scrollbarWidth;
		},
		enableBodyScroll: function () {
			$('body').css({
				'overflow': '',
				'padding-right': ''
			});
		}
	};

}(Mikit));
