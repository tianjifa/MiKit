/*
	Mikit. CSS & JS Framework
	Version 1.0
	http://mikit.missra.com/

	Copyright (c) 2017, Mikit.
	License: MIT
*/
if (typeof jQuery === 'undefined') {
	throw new Error('Mikit\'s requires jQuery')
};
;(function ($) {
	var version = $.fn.jquery.split('.');
	if (version[0] == 1 && version[1] < 8) {
		throw new Error('Mikit\'s requires at least jQuery v1.8');
	}
})(jQuery);
;(function () {
	// Inherits
	Function.prototype.inherits = function (parent) {
		var F = function () {};
		F.prototype = parent.prototype;
		var f = new F();

		for (var prop in this.prototype) f[prop] = this.prototype[prop];
		this.prototype = f;
		this.prototype.super = parent.prototype;
	};

	// Core Class
	var Mikit = function (element, options) {
		options = (typeof options === 'object') ? options : {};

		this.$element = $(element);
		this.opts = $.extend(true, this.defaults, $.fn[this.namespace].options, this.$element.data(), options);
		this.$target = (typeof this.opts.target === 'string') ? $(this.opts.target) : null;
	};

	// Core Functionality
	Mikit.prototype = {
		getInstance: function () {
			return this.$element.data('fn.' + this.namespace);
		},
		hasTarget: function () {
			return !(this.$target === null);
		},
		callback: function (type) {
			var args = [].slice.call(arguments).splice(1);

			// on element callback
			if (this.$element) {
				args = this._fireCallback($._data(this.$element[0], 'events'), type, this.namespace, args);
			}

			// on target callback
			if (this.$target) {
				args = this._fireCallback($._data(this.$target[0], 'events'), type, this.namespace, args);
			}

			// opts callback
			if (this.opts && this.opts.callbacks && $.isFunction(this.opts.callbacks[type])) {
				return this.opts.callbacks[type].apply(this, args);
			}

			return args;
		},
		_fireCallback: function (events, type, eventNamespace, args) {
			if (events && typeof events[type] !== 'undefined') {
				var len = events[type].length;
				for (var i = 0; i < len; i++) {
					var namespace = events[type][i].namespace;
					if (namespace === eventNamespace) {
						var value = events[type][i].handler.apply(this, args);
					}
				}
			}

			return (typeof value === 'undefined') ? args : value;
		}
	};

	// Scope
	window.Mikit = Mikit;

})();


/**
 * @library Mikit Plugin
 * @author Mikit
 */

(function (Mikit) {
	Mikit.Plugin = {
		create: function (classname, pluginname) {
			pluginname = (typeof pluginname === 'undefined') ? classname.toLowerCase() : pluginname;

			$.fn[pluginname] = function (method, options) {
				var args = Array.prototype.slice.call(arguments, 1);
				var name = 'fn.' + pluginname;
				var val = [];

				this.each(function () {
					var $this = $(this),
						data = $this.data(name);
					options = (typeof method === 'object') ? method : options;

					if (!data) {
						// Initialization
						$this.data(name, {});
						$this.data(name, (data = new Mikit[classname](this, options)));
					}

					// Call methods
					if (typeof method === 'string') {
						if ($.isFunction(data[method])) {
							var methodVal = data[method].apply(data, args);
							if (methodVal !== undefined) {
								val.push(methodVal);
							}
						} else {
							$.error('No such method "' + method + '" for ' + classname);
						}
					}

				});

				return (val.length === 0 || val.length === 1) ? ((val.length === 0) ? this : val[0]) : val;
			};

			$.fn[pluginname].options = {};

			return this;
		},
		autoload: function (pluginname) {
			var arr = pluginname.split(',');
			var len = arr.length;

			for (var i = 0; i < len; i++) {
				var name = arr[i].toLowerCase().split(',').map(function (s) {
					return s.trim()
				}).join(',');
				this.autoloadQueue.push(name);
			}

			return this;
		},
		autoloadQueue: [],
		startAutoload: function () {
			if (!window.MutationObserver || this.autoloadQueue.length === 0) {
				return;
			}

			var self = this;
			var observer = new MutationObserver(function (mutations) {
				mutations.forEach(function (mutation) {
					var newNodes = mutation.addedNodes;
					if (newNodes.length === 0 || (newNodes.length === 1 && newNodes.nodeType === 3)) {
						return;
					}

					self.startAutoloadOnce();
				});
			});

			// pass in the target node, as well as the observer options
			observer.observe(document, {
				subtree: true,
				childList: true
			});
		},
		startAutoloadOnce: function () {
			var self = this;
			var $nodes = $('[data-component]').not('[data-loaded]');
			$nodes.each(function () {
				var $el = $(this);
				var pluginname = $el.data('component');

				if (self.autoloadQueue.indexOf(pluginname) !== -1) {
					$el.attr('data-loaded', true);
					$el[pluginname]();
				}
			});

		},
		watch: function () {
			Mikit.Plugin.startAutoloadOnce();
			Mikit.Plugin.startAutoload();
		}
	};

	$(window).on('load', function () {
		Mikit.Plugin.watch();
	});

}(Mikit));



/**
 * @library Mikit Animation
 * @author Mikit
 */
(function (Mikit) {
	Mikit.Animation = function (element, effect, callback) {
		this.namespace = 'animation';
		this.defaults = {};

		// Parent Constructor
		Mikit.apply(this, arguments);

		// Initialization
		this.effect = effect;
		this.completeCallback = (typeof callback === 'undefined') ? false : callback;
		this.prefixes = ['', '-moz-', '-o-animation-', '-webkit-'];
		this.queue = [];

		this.start();
	};

	Mikit.Animation.prototype = {
		start: function () {
			if (this.isSlideEffect()) {
				this.setElementHeight();
			}

			this.addToQueue();
			this.clean();
			this.animate();
		},
		addToQueue: function () {
			this.queue.push(this.effect);
		},
		setElementHeight: function () {
			this.$element.height(this.$element.height());
		},
		removeElementHeight: function () {
			this.$element.css('height', '');
		},
		isSlideEffect: function () {
			return (this.effect === 'slideDown' || this.effect === 'slideUp');
		},
		isHideableEffect: function () {
			var effects = ['fadeOut', 'slideUp', 'flipOut', 'zoomOut', 'slideOutUp', 'slideOutRight', 'slideOutLeft'];

			return ($.inArray(this.effect, effects) !== -1);
		},
		isToggleEffect: function () {
			return (this.effect === 'show' || this.effect === 'hide');
		},
		storeHideClasses: function () {
			if (this.$element.hasClass('mi-hide-sm')) {
				this.$element.data('hide-sm-class', true);
			} else if (this.$element.hasClass('mi-hide-md')) {
				this.$element.data('hide-md-class', true);
			}
		},
		revertHideClasses: function () {
			if (this.$element.data('hide-sm-class')) {
				this.$element.addClass('mi-hide-sm').removeData('hide-sm-class');
			} else if (this.$element.data('hide-md-class')) {
				this.$element.addClass('mi-hide-md').removeData('hide-md-class');
			} else this.$element.addClass('mi-hide');
		},
		removeHideClass: function () {
			if (this.$element.data('hide-sm-class')) {
				this.$element.removeClass('mi-hide-sm');
			} else if (this.$element.data('hide-md-class')) {
				this.$element.removeClass('mi-hide-md');
			} else {
				this.$element.removeClass('mi-hide');
			}
		},
		animate: function () {
			this.storeHideClasses();
			if (this.isToggleEffect()) {
				return this.makeSimpleEffects();
			}

			this.$element.addClass('mi-animated');
			this.$element.addClass(this.queue[0]);
			this.removeHideClass();

			var _callback = (this.queue.length > 1) ? null : this.completeCallback;
			this.complete('AnimationEnd', $.proxy(this.makeComplete, this), _callback);
		},
		makeSimpleEffects: function () {
			if (this.effect === 'show') {
				this.removeHideClass();
			} else if (this.effect === 'hide') {
				this.revertHideClasses();
			}

			if (typeof this.completeCallback === 'function') {
				this.completeCallback(this);
			}
		},
		makeComplete: function () {
			if (this.$element.hasClass(this.queue[0])) {
				this.clean();
				this.queue.shift();

				if (this.queue.length) this.animate();
			}
		},
		complete: function (type, make, callback) {
			var event = type.toLowerCase() + ' webkit' + type + ' o' + type + ' MS' + type;

			this.$element.one(event, $.proxy(function () {
				if (typeof make === 'function') {
					make();
				}
				if (this.isHideableEffect()) {
					this.revertHideClasses();
				}
				if (this.isSlideEffect()) {
					this.removeElementHeight();
				}
				if (typeof callback === 'function') {
					callback(this);
				}

				this.$element.off(event);

			}, this));
		},
		clean: function () {
			this.$element.removeClass('mi-animated').removeClass(this.queue[0]);
		}
	};

	// Inheritance
	Mikit.Animation.inherits(Mikit);

}(Mikit));

// Plugin
(function ($) {
	$.fn.animation = function (effect, callback) {
		var name = 'fn.animation';

		return this.each(function () {
			var $this = $(this),
				data = $this.data(name);

			$this.data(name, {});
			$this.data(name, (data = new Mikit.Animation(this, effect, callback)));
		});
	};

	$.fn.animation.options = {};

})(jQuery);



/**
 * @library Mikit Detect
 * @author Mikit
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



/**
 * @library Mikit FormData
 * @author Mikit
 */

(function (Mikit) {
	Mikit.FormData = function (app) {
		this.opts = app.opts;
	};

	Mikit.FormData.prototype = {
		set: function (data) {
			this.data = data;
		},
		get: function (formdata) {
			this.formdata = formdata;

			if (this.opts.appendForms) this.appendForms();
			if (this.opts.appendFields) this.appendFields();

			return this.data;
		},
		appendFields: function () {
			var $fields = $(this.opts.appendFields);
			if ($fields.length === 0) {
				return;
			}

			var self = this;
			var str = '';

			if (this.formdata) {
				$fields.each(function () {
					self.data.append($(this).attr('name'), $(this).val());
				});
			} else {
				$fields.each(function () {
					str += '&' + $(this).attr('name') + '=' + $(this).val();
				});

				this.data = (this.data === '') ? str.replace(/^&/, '') : this.data + str;
			}
		},
		appendForms: function () {
			var $forms = $(this.opts.appendForms);
			if ($forms.length === 0) {
				return;
			}

			if (this.formdata) {
				var self = this;
				var formsData = $(this.opts.appendForms).serializeArray();
				$.each(formsData, function (i, s) {
					self.data.append(s.name, s.value);
				});
			} else {
				var str = $forms.serialize();

				this.data = (this.data === '') ? str : this.data + '&' + str;
			}
		}
	};

}(Mikit));



/**
 * @library Mikit Response
 * @author Mikit
 */

(function (Mikit) {
	Mikit.Response = function (app) {};

	Mikit.Response.prototype = {
		parse: function (str) {
			if (str === '') {
				return false;
			}

			var obj = {};

			try {
				obj = JSON.parse(str);
			} catch (e) {
				return false;
			}

			if (obj[0] !== undefined) {
				for (var item in obj) {
					this.parseItem(obj[item]);
				}
			} else {
				this.parseItem(obj);
			}

			return obj;
		},
		parseItem: function (item) {
			if (item.type === 'value') {
				$.each(item.data, $.proxy(function (key, val) {
					val = (val === null || val === false) ? 0 : val;
					val = (val === true) ? 1 : val;

					$(key).val(val);

				}, this));
			} else if (item.type === 'html') {
				$.each(item.data, $.proxy(function (key, val) {
					val = (val === null || val === false) ? '' : val;

					$(key).html(this.stripslashes(val));

				}, this));
			} else if (item.type === 'addClass') {
				$.each(item.data, function (key, val) {
					$(key).addClass(val);
				});
			} else if (item.type === 'removeClass') {
				$.each(item.data, function (key, val) {
					$(key).removeClass(val);
				});
			} else if (item.type === 'command') {
				$.each(item.data, function (key, val) {
					$(val)[key]();
				});
			} else if (item.type === 'animation') {
				$.each(item.data, function (key, data) {
					data.opts = (typeof data.opts === 'undefined') ? {} : data.opts;

					$(key).animation(data.name, data.opts);
				});
			} else if (item.type === 'location') {
				top.location.href = item.data;
			} else if (item.type === 'notify') {
				$.notify(item.data);
			}

			return item;
		},
		stripslashes: function (str) {
			return (str + '').replace(/\0/g, '0').replace(/\\([\\'"])/g, '$1');
		}
	};

}(Mikit));



/**
 * @library Mikit Utils
 * @author Mikit
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
			if (isOverflowing) {
				$body.css('padding-right', scrollbarWidth);
			}
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



/**
 * @library Mikit Message
 * @author Mikit
 */

(function (Mikit) {
	Mikit.Message = function (element, options) {
		this.namespace = 'message';
		this.defaults = {
			closeSelector: '.mi-close',
			closeEvent: 'click',
			animationOpen: 'fadeIn',
			animationClose: 'fadeOut',
			callbacks: ['open', 'opened', 'close', 'closed']
		};

		// Parent Constructor
		Mikit.apply(this, arguments);

		// Initialization
		this.start();
	};

	// Functionality
	Mikit.Message.prototype = {
		start: function () {
			this.$close = this.$element.find(this.opts.closeSelector);
			this.$close.on(this.opts.closeEvent + '.' + this.namespace, $.proxy(this.close, this));
			this.$element.addClass('mi-open');
		},
		stop: function () {
			this.$close.off('.' + this.namespace);
			this.$element.removeClass('mi-open');
		},
		open: function (e) {
			if (e) {
				e.preventDefault();
			}

			if (!this.isOpened()) {
				this.callback('open');
				this.$element.animation(this.opts.animationOpen, $.proxy(this.onOpened, this));
			}
		},
		isOpened: function () {
			return this.$element.hasClass('mi-open');
		},
		onOpened: function () {
			this.callback('opened');
			this.$element.addClass('mi-open');
		},
		close: function (e) {
			if (e) {
				e.preventDefault();
			}

			if (this.isOpened()) {
				this.callback('close');
				this.$element.animation(this.opts.animationClose, $.proxy(this.onClosed, this));
			}
		},
		onClosed: function () {
			this.callback('closed');
			this.$element.removeClass('mi-open');
		}
	};

	// Inheritance
	Mikit.Message.inherits(Mikit);

	// Plugin
	Mikit.Plugin.create('Message');
	Mikit.Plugin.autoload('Message');

}(Mikit));



/**
 * @library Mikit Sticky
 * @author Mikit
 */

(function (Mikit) {
	Mikit.Sticky = function (element, options) {
		this.namespace = 'sticky';
		this.defaults = {
			classname: 'mi-fixed',
			offset: 0, // pixels
			callbacks: ['fixed', 'unfixed']
		};

		// Parent Constructor
		Mikit.apply(this, arguments);

		// Initialization
		this.start();
	};

	// Functionality
	Mikit.Sticky.prototype = {
		start: function () {
			this.offsetTop = this.getOffsetTop();

			this.load();
			$(window).scroll($.proxy(this.load, this));
		},
		getOffsetTop: function () {
			return this.$element.offset().top;
		},
		load: function () {
			return (this.isFix()) ? this.fixed() : this.unfixed();
		},
		isFix: function () {
			return ($(window).scrollTop() > (this.offsetTop + this.opts.offset));
		},
		fixed: function () {
			this.$element.addClass(this.opts.classname).css('top', this.opts.offset + 'px');
			this.callback('fixed');
		},
		unfixed: function () {
			this.$element.removeClass(this.opts.classname).css('top', '');
			this.callback('unfixed');
		}
	};

	// Inheritance
	Mikit.Sticky.inherits(Mikit);

	// Plugin
	Mikit.Plugin.create('Sticky');
	Mikit.Plugin.autoload('Sticky');

}(Mikit));



/**
 * @library Mikit Toggleme
 * @author Mikit
 */

(function (Mikit) {
	Mikit.Toggleme = function (element, options) {
		this.namespace = 'toggleme';
		this.defaults = {
			toggleEvent: 'click',
			target: null,
			text: '',
			animationOpen: 'slideDown',
			animationClose: 'slideUp',
			callbacks: ['open', 'opened', 'close', 'closed']
		};

		// Parent Constructor
		Mikit.apply(this, arguments);

		// Initialization
		this.start();
	};

	// Functionality
	Mikit.Toggleme.prototype = {
		start: function () {
			if (!this.hasTarget()) return;

			this.$element.on(this.opts.toggleEvent + '.' + this.namespace, $.proxy(this.toggle, this));
		},
		stop: function () {
			this.$element.off('.' + this.namespace);
			this.revertText();
		},
		toggle: function (e) {
			if (this.isOpened()) this.close(e);
			else this.open(e);
		},
		open: function (e) {
			if (e) e.preventDefault();

			if (!this.isOpened()) {
				this.storeText();
				this.callback('open');
				this.$target.animation('slideDown', $.proxy(this.onOpened, this));

				// changes the text of $element with a less delay to smooth
				setTimeout($.proxy(this.replaceText, this), 100);
			}
		},
		close: function (e) {
			if (e) e.preventDefault();

			if (this.isOpened()) {
				this.callback('close');
				this.$target.animation('slideUp', $.proxy(this.onClosed, this));
			}
		},
		isOpened: function () {
			return (this.$target.hasClass('mi-open'));
		},
		onOpened: function () {
			this.$target.addClass('mi-open');
			this.callback('opened');
		},
		onClosed: function () {
			this.$target.removeClass('mi-open');
			this.revertText();
			this.callback('closed');
		},
		storeText: function () {
			this.$element.data('replacement-text', this.$element.html());
		},
		revertText: function () {
			var text = this.$element.data('replacement-text');
			if (text) this.$element.html(text);

			this.$element.removeData('replacement-text');
		},
		replaceText: function () {
			if (this.opts.text !== '') {
				this.$element.html(this.opts.text);
			}
		}
	};

	// Inheritance
	Mikit.Toggleme.inherits(Mikit);

	// Plugin
	Mikit.Plugin.create('Toggleme');
	Mikit.Plugin.autoload('Toggleme');

}(Mikit));



/**
 * @library Mikit Offcanvas
 * @author Mikit
 */

(function (Mikit) {
	Mikit.Offcanvas = function (element, options) {
		this.namespace = 'offcanvas';
		this.defaults = {
			target: null, // selector
			push: true, // boolean
			width: '250px', // string
			direction: 'left', // string: left or right
			toggleEvent: 'click',
			clickOutside: true, // boolean
			animationOpen: 'slideInLeft',
			animationClose: 'slideOutLeft',
			callbacks: ['open', 'opened', 'close', 'closed']
		};

		// Parent Constructor
		Mikit.apply(this, arguments);

		// Services
		this.utils = new Mikit.Utils();
		this.detect = new Mikit.Detect();

		// Initialization
		this.start();
	};

	// Functionality
	Mikit.Offcanvas.prototype = {
		start: function () {
			if (!this.hasTarget()) return;

			this.buildTargetWidth();
			this.buildAnimationDirection();

			this.$close = this.getCloseLink();
			this.$element.on(this.opts.toggleEvent + '.' + this.namespace, $.proxy(this.toggle, this));
			this.$target.addClass('mi-offcanvas');
		},
		stop: function () {
			this.closeAll();

			this.$element.off('.' + this.namespace);
			this.$close.off('.' + this.namespace);
			$(document).off('.' + this.namespace);
		},
		toggle: function (e) {
			if (this.isOpened()) this.close(e);
			else this.open(e);
		},
		buildTargetWidth: function () {
			this.opts.width = ($(window).width() < parseInt(this.opts.width)) ? '100%' : this.opts.width;
		},
		buildAnimationDirection: function () {
			if (this.opts.direction === 'right') {
				this.opts.animationOpen = 'slideInRight';
				this.opts.animationClose = 'slideOutRight';
			}
		},
		getCloseLink: function () {
			return this.$target.find('.mi-close');
		},
		open: function (e) {
			if (e) e.preventDefault();

			if (!this.isOpened()) {
				this.closeAll();
				this.callback('open');

				this.$target.addClass('mi-offcanvas-' + this.opts.direction);
				this.$target.css('width', this.opts.width);

				this.pushBody();

				this.$target.animation(this.opts.animationOpen, $.proxy(this.onOpened, this));
			}
		},
		closeAll: function () {
			var $elms = $(document).find('.offcanvas');
			if ($elms.length !== 0) {
				$elms.each(function () {
					var $el = $(this);

					if ($el.hasClass('mi-open')) {
						$el.css('width', '').animation('hide');
						$el.removeClass('mi-open mi-offcanvas-left mi-offcanvas-right');
					}

				});

				$(document).off('.' + this.namespace);
				$('body').css('left', '');
			}
		},
		close: function (e) {
			if (e) {
				var $el = $(e.target);
				var isTag = ($el[0].tagName === 'A' || $el[0].tagName === 'BUTTON');
				if (isTag && $el.closest('.mi-offcanvas').length !== 0 && !$el.hasClass('mi-close')) {
					return;
				}

				e.preventDefault();
			}

			if (this.isOpened()) {
				this.utils.enableBodyScroll();
				this.callback('close');
				this.pullBody();
				this.$target.animation(this.opts.animationClose, $.proxy(this.onClosed, this));
			}
		},
		isOpened: function () {
			return (this.$target.hasClass('mi-open'));
		},
		onOpened: function () {
			if (this.opts.clickOutside) $(document).on('click.' + this.namespace, $.proxy(this.close, this));
			if (this.detect.isMobileScreen()) $('html').addClass('mi-no-scroll');

			$(document).on('keyup.' + this.namespace, $.proxy(this.handleKeyboard, this));
			this.$close.on('click.' + this.namespace, $.proxy(this.close, this));

			this.utils.disableBodyScroll();
			this.$target.addClass('mi-open');
			this.callback('opened');
		},
		onClosed: function () {
			if (this.detect.isMobileScreen()) $('html').removeClass('mi-no-scroll');

			this.$target.css('width', '').removeClass('mi-offcanvas-' + this.opts.direction);

			this.$close.off('.' + this.namespace);
			$(document).off('.' + this.namespace);

			this.$target.removeClass('mi-open');
			this.callback('closed');
		},
		handleKeyboard: function (e) {
			if (e.which === 27) this.close();
		},
		pullBody: function () {
			if (this.opts.push) {
				$('body').animate({
					left: 0
				}, 350, function () {
					$(this).removeClass('mi-offcanvas-push-body');
				});
			}
		},
		pushBody: function () {
			if (this.opts.push) {
				var properties = (this.opts.direction === 'left') ? {
					'left': this.opts.width
				} : {
					'left': '-' + this.opts.width
				};
				$('body').addClass('mi-offcanvas-push-body').animate(properties, 200);
			}
		}
	};

	// Inheritance
	Mikit.Offcanvas.inherits(Mikit);

	// Plugin
	Mikit.Plugin.create('Offcanvas');
	Mikit.Plugin.autoload('Offcanvas');

}(Mikit));



/**
 * @library Mikit Collapse
 * @author Mikit
 */

(function (Mikit) {
	Mikit.Collapse = function (element, options) {
		this.namespace = 'collapse';
		this.defaults = {
			target: null,
			toggle: true,
			active: false, // string (hash = tab id selector)
			toggleClass: 'mi-collapse-toggle',
			boxClass: 'mi-collapse-box',
			callbacks: ['open', 'opened', 'close', 'closed'],

			// private
			hashes: [],
			currentHash: false,
			currentItem: false
		};

		// Parent Constructor
		Mikit.apply(this, arguments);

		// Initialization
		this.start();
	};

	// Functionality
	Mikit.Collapse.prototype = {
		start: function () {
			// items
			this.$items = this.getItems();
			this.$items.each($.proxy(this.loadItems, this));

			// boxes
			this.$boxes = this.getBoxes();

			// active
			this.setActiveItem();
		},
		getItems: function () {
			return this.$element.find('.' + this.opts.toggleClass);
		},
		getBoxes: function () {
			return this.$element.find('.' + this.opts.boxClass);
		},
		loadItems: function (i, el) {
			var item = this.getItem(el);

			// set item identificator
			item.$el.attr('rel', item.hash);

			// active
			if (!$(item.hash).hasClass('mi-hide')) {
				this.opts.currentItem = item;
				this.opts.active = item.hash;

				item.$el.addClass('mi-active');
			}

			// event
			item.$el.on('click.collapse', $.proxy(this.toggle, this));

		},
		setActiveItem: function () {
			if (this.opts.active !== false) {
				this.opts.currentItem = this.getItemBy(this.opts.active);
				this.opts.active = this.opts.currentItem.hash;
			}

			if (this.opts.currentItem !== false) {
				this.addActive(this.opts.currentItem);
				this.opts.currentItem.$box.removeClass('mi-hide');
			}
		},
		addActive: function (item) {
			item.$box.removeClass('mi-hide').addClass('mi-open');
			item.$el.addClass('mi-active');

			if (item.$caret !== false) item.$caret.removeClass('mi-down').addClass('mi-up');
			if (item.$parent !== false) item.$parent.addClass('mi-active');

			this.opts.currentItem = item;
		},
		removeActive: function (item) {
			item.$box.removeClass('mi-open');
			item.$el.removeClass('mi-active');

			if (item.$caret !== false) item.$caret.addClass('mi-down').removeClass('mi-up');
			if (item.$parent !== false) item.$parent.removeClass('mi-active');

			this.opts.currentItem = false;
		},
		toggle: function (e) {
			if (e) e.preventDefault();

			var target = $(e.target).closest('.' + this.opts.toggleClass).get(0) || e.target;
			var item = this.getItem(target);

			if (this.isOpened(item.hash)) this.close(item.hash);
			else this.open(e)
		},
		openAll: function () {
			this.$items.addClass('mi-active');
			this.$boxes.addClass('mi-open').removeClass('mi-hide');
		},
		open: function (e, push) {
			if (typeof e === 'undefined') return;
			if (typeof e === 'object') e.preventDefault();

			var target = $(e.target).closest('.' + this.opts.toggleClass).get(0) || e.target;
			var item = (typeof e === 'object') ? this.getItem(target) : this.getItemBy(e);

			if (item.$box.hasClass('mi-open')) {
				return;
			}

			if (this.opts.toggle) this.closeAll();

			this.callback('open', item);
			this.addActive(item);

			item.$box.animation('slideDown', $.proxy(this.onOpened, this));
		},
		onOpened: function () {
			this.callback('opened', this.opts.currentItem);
		},
		closeAll: function () {
			this.$items.removeClass('mi-active').closest('li').removeClass('mi-active');
			this.$boxes.removeClass('mi-open').addClass('mi-hide');
		},
		close: function (num) {
			var item = this.getItemBy(num);

			this.callback('close', item);

			this.opts.currentItem = item;

			item.$box.animation('slideUp', $.proxy(this.onClosed, this));
		},
		onClosed: function () {
			var item = this.opts.currentItem;

			this.removeActive(item);
			this.callback('closed', item);
		},
		isOpened: function (hash) {
			return $(hash).hasClass('mi-open');
		},
		getItem: function (element) {
			var item = {};

			item.$el = $(element);
			item.hash = item.$el.attr('href');
			item.$box = $(item.hash);

			var $parent = item.$el.parent();
			item.$parent = ($parent[0].tagName === 'LI') ? $parent : false;

			var $caret = item.$el.find('.mi-caret');
			item.$caret = ($caret.length !== 0) ? $caret : false;

			return item;
		},
		getItemBy: function (num) {
			var element = (typeof num === 'number') ? this.$items.eq(num - 1) : this.$element.find('[rel="' + num + '"]');

			return this.getItem(element);
		}
	};

	// Inheritance
	Mikit.Collapse.inherits(Mikit);

	// Plugin
	Mikit.Plugin.create('Collapse');
	Mikit.Plugin.autoload('Collapse');

}(Mikit));



/**
 * @library Mikit Dropdown
 * @author Mikit
 */

(function (Mikit) {
	Mikit.Dropdown = function (element, options) {
		this.namespace = 'dropdown';
		this.defaults = {
			target: null,
			toggleEvent: 'click',
			height: false, // integer
			width: false, // integer
			animationOpen: 'slideDown',
			animationClose: 'slideUp',
			caretUp: false,
			callbacks: ['open', 'opened', 'close', 'closed']
		};

		// Parent Constructor
		Mikit.apply(this, arguments);

		// Services
		this.utils = new Mikit.Utils();
		this.detect = new Mikit.Detect();

		// Initialization
		this.start();
	};

	// Functionality
	Mikit.Dropdown.prototype = {
		start: function () {
			this.buildClose();
			this.buildCaret();

			if (this.detect.isMobile()) this.buildMobileAnimation();

			this.$target.addClass('mi-hide');
			this.$element.on(this.opts.toggleEvent + '.' + this.namespace, $.proxy(this.toggle, this));

		},
		stop: function () {
			this.$element.off('.' + this.namespace);
			this.$target.removeClass('mi-open').addClass('mi-hide');
			this.disableEvents();
		},
		buildMobileAnimation: function () {
			this.opts.animationOpen = 'fadeIn';
			this.opts.animationClose = 'fadeOut';
		},
		buildClose: function () {
			this.$close = this.$target.find('.mi-close');
		},
		buildCaret: function () {
			this.$caret = this.getCaret();
			this.buildCaretPosition();
		},
		buildCaretPosition: function () {
			var height = this.$element.offset().top + this.$element.innerHeight() + this.$target.innerHeight();

			if ($(document).height() > height) {
				return;
			}

			this.opts.caretUp = true;
			this.$caret.addClass('mi-up');
		},
		getCaret: function () {
			return this.$element.find('.mi-caret');
		},
		toggleCaretOpen: function () {
			if (this.opts.caretUp) this.$caret.removeClass('mi-up').addClass('mi-down');
			else this.$caret.removeClass('mi-down').addClass('mi-up');
		},
		toggleCaretClose: function () {
			if (this.opts.caretUp) this.$caret.removeClass('mi-down').addClass('mi-up');
			else this.$caret.removeClass('mi-up').addClass('mi-down');
		},
		toggle: function (e) {
			if (this.isOpened()) this.close(e);
			else this.open(e);
		},
		open: function (e) {
			if (e) e.preventDefault();

			this.callback('open');
			$('.mi-dropdown').removeClass('mi-open').addClass('mi-hide');

			if (this.opts.height) this.$target.css('min-height', this.opts.height + 'px');
			if (this.opts.width) this.$target.width(this.opts.width);

			this.setPosition();
			this.toggleCaretOpen();

			this.$target.animation(this.opts.animationOpen, $.proxy(this.onOpened, this));
		},
		close: function (e) {
			if (!this.isOpened()) {
				return;
			}

			if (e) {
				if (this.shouldNotBeClosed(e.target)) {
					return;
				}

				e.preventDefault();
			}

			this.utils.enableBodyScroll();
			this.callback('close');
			this.toggleCaretClose();

			this.$target.animation(this.opts.animationClose, $.proxy(this.onClosed, this));
		},
		onClosed: function () {
			this.$target.removeClass('mi-open');
			this.disableEvents();
			this.callback('closed');
		},
		onOpened: function () {
			this.$target.addClass('mi-open');
			this.enableEvents();
			this.callback('opened');
		},
		isOpened: function () {
			return (this.$target.hasClass('mi-open'));
		},
		enableEvents: function () {
			if (this.detect.isDesktop()) {
				this.$target.on('mouseover.' + this.namespace, $.proxy(this.utils.disableBodyScroll, this.utils)).on('mouseout.' + this.namespace, $.proxy(this.utils.enableBodyScroll, this.utils));
			}

			$(document).on('scroll.' + this.namespace, $.proxy(this.setPosition, this));
			$(window).on('resize.' + this.namespace, $.proxy(this.setPosition, this));
			$(document).on('click.' + this.namespace + ' touchstart.' + this.namespace, $.proxy(this.close, this));
			$(document).on('keydown.' + this.namespace, $.proxy(this.handleKeyboard, this));
			this.$target.find('[data-action="dropdown-close"]').on('click.' + this.namespace, $.proxy(this.close, this));
		},
		disableEvents: function () {
			this.$target.off('.' + this.namespace);
			$(document).off('.' + this.namespace);
			$(window).off('.' + this.namespace);
		},
		handleKeyboard: function (e) {
			if (e.which === 27) this.close(e);
		},
		shouldNotBeClosed: function (el) {
			if ($(el).attr('data-action') === 'dropdown-close' || el === this.$close[0]) {
				return false;
			} else if ($(el).closest('.mi-dropdown').length === 0) {
				return false;
			}

			return true;
		},
		isNavigationFixed: function () {
			return (this.$element.closest('.mi-fixed').length !== 0);
		},
		getPlacement: function (height) {
			return ($(document).height() < height) ? 'top' : 'bottom';
		},
		getOffset: function (position) {
			return (this.isNavigationFixed()) ? this.$element.position() : this.$element.offset();
		},
		getPosition: function () {
			return (this.isNavigationFixed()) ? 'fixed' : 'absolute';
		},
		setPosition: function () {
			if (this.detect.isMobile()) {
				this.$target.addClass('mi-dropdown-mobile');
				return;
			}

			var position = this.getPosition();
			var coords = this.getOffset(position);
			var height = this.$target.innerHeight();
			var width = this.$target.innerWidth();
			var placement = this.getPlacement(coords.top + height + this.$element.innerHeight());
			var leftFix = ($(window).width() < (coords.left + width)) ? (width - this.$element.innerWidth()) : 0;
			var top, left = coords.left - leftFix;

			if (placement === 'bottom') {
				if (!this.isOpened()) this.$caret.removeClass('mi-up').addClass('mi-down');

				this.opts.caretUp = false;
				top = coords.top + this.$element.outerHeight() + 1;
			} else {
				this.opts.animationOpen = 'show';
				this.opts.animationClose = 'hide';

				if (!this.isOpened()) this.$caret.addClass('mi-up').removeClass('mi-down');

				this.opts.caretUp = true;
				top = coords.top - height - 1;
			}

			this.$target.css({
				position: position,
				top: top + 'px',
				left: left + 'px'
			});
		}
	};

	// Inheritance
	Mikit.Dropdown.inherits(Mikit);

	// Plugin
	Mikit.Plugin.create('Dropdown');
	Mikit.Plugin.autoload('Dropdown');

}(Mikit));



/**
 * @library Mikit Tab
 * @author Mikit
 */

(function (Mikit) {
	Mikit.Tab = function (element, options) {
		this.namespace = 'tab';
		this.defaults = {
			equals: false,
			active: false, // string (hash = tab id selector)
			live: false, // class selector
			hash: true, //boolean
			callbacks: ['init', 'next', 'prev', 'open', 'opened', 'close', 'closed']
		};

		// Parent Constructor
		Mikit.apply(this, arguments);

		// Initialization
		this.start();
	};

	// Functionality
	Mikit.Tab.prototype = {
		start: function () {
			if (this.opts.live !== false) this.buildLiveTab();

			this.tabCollection = [];
			this.hashesCollection = [];
			this.currentHash = [];
			this.currentItem = false;

			// items
			this.$items = this.getItems();
			this.$items.each($.proxy(this.loadItems, this));

			// tab
			this.$tab = this.getTab();

			// location hash
			this.currentHash = this.getLocationHash();

			// close all
			this.closeAll();

			// active & height
			this.setActiveItem();
			this.setItemHeight();

			// callback
			this.callback('init');

		},
		getTab: function () {
			return $(this.tabCollection).map(function () {
				return this.toArray();
			});
		},
		getItems: function () {
			return this.$element.find('a');
		},
		loadItems: function (i, el) {
			var item = this.getItem(el);

			// set item identificator
			item.$el.attr('rel', item.hash);

			// collect item
			this.collectItem(item);

			// active
			if (item.$parent.hasClass('mi-active')) {
				this.currentItem = item;
				this.opts.active = item.hash;
			}

			// event
			item.$el.on('click.tab', $.proxy(this.open, this));

		},
		collectItem: function (item) {
			this.tabCollection.push(item.$tab);
			this.hashesCollection.push(item.hash);
		},
		buildLiveTab: function () {
			var $layers = $(this.opts.live);

			if ($layers.length === 0) {
				return;
			}

			this.$liveTabList = $('<ul />');
			$layers.each($.proxy(this.buildLiveItem, this));

			this.$element.html('').append(this.$liveTabList);

		},
		buildLiveItem: function (i, tab) {
			var $tab = $(tab);
			var $li = $('<li />');
			var $a = $('<a />');
			var index = i + 1;

			$tab.attr('id', this.getLiveItemId($tab, index));

			var hash = '#' + $tab.attr('id');
			var title = this.getLiveItemTitle($tab);

			$a.attr('href', hash).attr('rel', hash).text(title);
			$li.append($a);

			this.$liveTabList.append($li);
		},
		getLiveItemId: function ($tab, index) {
			return (typeof $tab.attr('id') === 'undefined') ? this.opts.live.replace('.', '') + index : $tab.attr('id');
		},
		getLiveItemTitle: function ($tab) {
			return (typeof $tab.attr('data-title') === 'undefined') ? $tab.attr('id') : $tab.attr('data-title');
		},
		setActiveItem: function () {
			if (this.currentHash) {
				this.currentItem = this.getItemBy(this.currentHash);
				this.opts.active = this.currentHash;
			} else if (this.opts.active === false) {
				this.currentItem = this.getItem(this.$items.first());
				this.opts.active = this.currentItem.hash;
			}

			this.addActive(this.currentItem);
		},
		addActive: function (item) {
			item.$parent.addClass('mi-active');
			item.$tab.removeClass('mi-hide').addClass('mi-open');

			this.currentItem = item;
		},
		removeActive: function (item) {
			item.$parent.removeClass('mi-active');
			item.$tab.addClass('mi-hide').removeClass('mi-open');

			this.currentItem = false;
		},
		next: function (e) {
			if (e) e.preventDefault();

			var item = this.getItem(this.fetchElement('next'));

			this.open(item.hash);
			this.callback('next', item);

		},
		prev: function (e) {
			if (e) e.preventDefault();

			var item = this.getItem(this.fetchElement('prev'));

			this.open(item.hash);
			this.callback('prev', item);
		},
		fetchElement: function (type) {
			var element;
			if (this.currentItem !== false) {
				// prev or next
				element = this.currentItem.$parent[type]().find('a');

				if (element.length === 0) {
					return;
				}
			} else {
				// first
				element = this.$items[0];
			}

			return element;
		},
		open: function (e, push) {
			if (typeof e === 'undefined') return;
			if (typeof e === 'object') e.preventDefault();

			var item = (typeof e === 'object') ? this.getItem(e.target) : this.getItemBy(e);
			this.closeAll();

			this.callback('open', item);
			this.addActive(item);

			// push state (doesn't need to push at the start)
			this.pushStateOpen(push, item);
			this.callback('opened', item);
		},
		pushStateOpen: function (push, item) {
			if (push !== false && this.opts.hash !== false) {
				history.pushState(false, false, item.hash);
			}
		},
		close: function (num) {
			var item = this.getItemBy(num);

			if (!item.$parent.hasClass('mi-active')) {
				return;
			}

			this.callback('close', item);
			this.removeActive(item);
			this.pushStateClose();
			this.callback('closed', item);

		},
		pushStateClose: function () {
			if (this.opts.hash !== false) {
				history.pushState(false, false, ' ');
			}
		},
		closeAll: function () {
			this.$tab.removeClass('mi-open').addClass('mi-hide');
			this.$items.parent().removeClass('mi-active');
		},
		getItem: function (element) {
			var item = {};

			item.$el = $(element);
			item.hash = item.$el.attr('href');
			item.$parent = item.$el.parent();
			item.$tab = $(item.hash);

			return item;
		},
		getItemBy: function (num) {
			var element = (typeof num === 'number') ? this.$items.eq(num - 1) : this.$element.find('[rel="' + num + '"]');

			return this.getItem(element);
		},
		getLocationHash: function () {
			if (this.opts.hash === false) {
				return false;
			}

			return (this.isHash()) ? top.location.hash : false;
		},
		isHash: function () {
			return !(top.location.hash === '' || $.inArray(top.location.hash, this.hashesCollection) === -1);
		},
		setItemHeight: function () {
			if (this.opts.equals) {
				var minHeight = this.getItemMaxHeight() + 'px';
				this.$tab.css('min-height', minHeight);
			}
		},
		getItemMaxHeight: function () {
			var max = 0;
			this.$tab.each(function () {
				var h = $(this).height();
				max = h > max ? h : max;
			});

			return max;
		}
	};

	// Inheritance
	Mikit.Tab.inherits(Mikit);

	// Plugin
	Mikit.Plugin.create('Tab');
	Mikit.Plugin.autoload('Tab');

}(Mikit));


/**
 * @library Mikit Modal
 * @author Mikit
 */

(function ($) {
	$.modalcurrent = null;
	$.modalwindow = function (options) {
		var opts = $.extend({}, options, {
			show: true
		});
		var $element = $('<span />');

		$element.modal(opts);
	};

})(jQuery);

(function (Mikit) {
	Mikit.Modal = function (element, options) {
		this.namespace = 'modal';
		this.defaults = {
			target: null,
			show: false,
			url: false,
			header: false,
			width: '600px', // string
			height: false, // or string
			maxHeight: false,
			position: 'center', // top or center
			overlay: true,
			appendForms: false,
			appendFields: false,
			animationOpen: 'show',
			animationClose: 'hide',
			callbacks: ['open', 'opened', 'close', 'closed']
		};

		// Parent Constructor
		Mikit.apply(this, arguments);

		// Services
		this.utils = new Mikit.Utils();
		this.detect = new Mikit.Detect();

		// Initialization
		this.start();
	};

	// Functionality
	Mikit.Modal.prototype = {
		start: function () {
			if (!this.hasTarget()) {
				return;
			}

			if (this.opts.show) this.load();
			else this.$element.on('click.' + this.namespace, $.proxy(this.load, this));
		},
		buildModal: function () {
			this.$modal = this.$target.find('.mi-modal');
			this.$header = this.$target.find('.mi-modal-header');
			this.$close = this.$target.find('.mi-close');
			this.$body = this.$target.find('.mi-modal-body');
		},
		buildOverlay: function () {
			if (this.opts.overlay === false) {
				return;
			}

			if ($('#mi-modal-overlay').length !== 0) {
				this.$overlay = $('#mi-modal-overlay');
			} else {
				this.$overlay = $('<div id="mi-modal-overlay">').addClass('mi-hide');
				$('body').prepend(this.$overlay);
			}

			this.$overlay.addClass('mi-overlay');
		},
		buildHeader: function () {
			if (this.opts.header) this.$header.html(this.opts.header);
		},
		load: function (e) {
			this.buildModal();
			this.buildOverlay();
			this.buildHeader();

			if (this.opts.url) this.buildContent();
			else this.open(e);
		},
		open: function (e) {
			if (e) e.preventDefault();

			if (this.isOpened()) {
				return;
			}

			if (this.detect.isMobile()) this.opts.width = '96%';
			if (this.opts.overlay) this.$overlay.removeClass('mi-hide');

			this.$target.removeClass('mi-hide');
			this.$modal.removeClass('mi-hide');

			this.enableEvents();
			this.findActions();

			this.resize();
			$(window).on('resize.' + this.namespace, $.proxy(this.resize, this));

			if (this.detect.isDesktop()) this.utils.disableBodyScroll();

			// enter
			this.$modal.find('input[type=text],input[type=url],input[type=email]').on('keydown.' + this.namespace, $.proxy(this.handleEnter, this));

			this.callback('open');
			this.$modal.animation(this.opts.animationOpen, $.proxy(this.onOpened, this));
		},
		close: function (e) {
			if (!this.$modal || !this.isOpened()) {
				return;
			}

			if (e) {
				if (this.shouldNotBeClosed(e.target)) {
					return;
				}

				e.preventDefault();
			}

			this.callback('close');
			this.disableEvents();

			this.$modal.animation(this.opts.animationClose, $.proxy(this.onClosed, this));

			if (this.opts.overlay) this.$overlay.animation(this.opts.animationClose);
		},
		onOpened: function () {
			this.$modal.addClass('mi-open');
			this.callback('opened');

			$.modalcurrent = this;
		},
		onClosed: function () {
			this.callback('closed');

			this.$target.addClass('mi-hide');
			this.$modal.removeClass('mi-open');

			if (this.detect.isDesktop()) this.utils.enableBodyScroll();

			this.$body.css('height', '');
			$.modalcurrent = null;
		},
		isOpened: function () {
			return (this.$modal.hasClass('mi-open'));
		},
		getData: function () {
			var formdata = new Mikit.FormData(this);
			formdata.set('');

			return formdata.get();
		},
		buildContent: function () {
			$.ajax({
				url: this.opts.url + '?' + new Date().getTime(),
				cache: false,
				type: 'post',
				data: this.getData(),
				success: $.proxy(function (data) {
					this.$body.html(data);
					this.open();
				}, this)
			});
		},
		buildWidth: function () {
			var width = this.opts.width;
			var top = '2%';
			var bottom = '2%';
			var percent = width.match(/%$/);

			if ((parseInt(this.opts.width) > $(window).width()) && !percent) {
				width = '96%';
			} else if (!percent) {
				top = '16px';
				bottom = '16px';
			}

			this.$modal.css({
				'width': width,
				'margin-top': top,
				'margin-bottom': bottom
			});

		},
		buildPosition: function () {
			if (this.opts.position !== 'center') {
				return;
			}

			var windowHeight = $(window).height();
			var height = this.$modal.outerHeight();
			var top = (windowHeight / 2 - height / 2) + 'px';

			if (this.detect.isMobile()) top = '2%';
			else if (height > windowHeight) top = '16px';

			this.$modal.css('margin-top', top);
		},
		buildHeight: function () {
			var windowHeight = $(window).height();

			if (this.opts.maxHeight) {
				var padding = parseInt(this.$body.css('padding-top')) + parseInt(this.$body.css('padding-bottom'));
				var margin = parseInt(this.$modal.css('margin-top')) + parseInt(this.$modal.css('margin-bottom'));
				var height = windowHeight - this.$header.innerHeight() - padding - margin;

				this.$body.height(height);
			} else if (this.opts.height !== false) {
				this.$body.css('height', this.opts.height);
			}

			var modalHeight = this.$modal.outerHeight();
			if (modalHeight > windowHeight) {
				this.opts.animationOpen = 'show';
				this.opts.animationClose = 'hide';
			}
		},
		resize: function () {
			this.buildWidth();
			this.buildPosition();
			this.buildHeight();
		},
		enableEvents: function () {
			this.$close.on('click.' + this.namespace, $.proxy(this.close, this));
			$(document).on('keyup.' + this.namespace, $.proxy(this.handleEscape, this));
			this.$target.on('click.' + this.namespace, $.proxy(this.close, this));
		},
		disableEvents: function () {
			this.$close.off('.' + this.namespace);
			$(document).off('.' + this.namespace);
			this.$target.off('.' + this.namespace);
			$(window).off('.' + this.namespace);
		},
		findActions: function () {
			this.$body.find('[data-action="modal-close"]').on('mousedown.' + this.namespace, $.proxy(this.close, this));
		},
		setHeader: function (header) {
			this.$header.html(header);
		},
		setContent: function (content) {
			this.$body.html(content);
		},
		setWidth: function (width) {
			this.opts.width = width;
			this.resize();
		},
		getModal: function () {
			return this.$modal;
		},
		getBody: function () {
			return this.$body;
		},
		getHeader: function () {
			return this.$header;
		},
		handleEnter: function (e) {
			if (e.which === 13) {
				e.preventDefault();
				this.close(false);
			}
		},
		handleEscape: function (e) {
			return (e.which === 27) ? this.close(false) : true;
		},
		shouldNotBeClosed: function (el) {
			if ($(el).attr('data-action') === 'modal-close' || el === this.$close[0]) {
				return false;
			} else if ($(el).closest('.mi-modal').length === 0) {
				return false;
			}

			return true;
		}
	};

	// Inheritance
	Mikit.Modal.inherits(Mikit);

	// Plugin
	Mikit.Plugin.create('Modal');
	Mikit.Plugin.autoload('Modal');

}(Mikit));
