/**
 * @library Mikit Offcanvas
 * @author Mikit
 * @license MIT
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
			var $elms = $(document).find('.mi-offcanvas');
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