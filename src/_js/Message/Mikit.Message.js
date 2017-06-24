/**
 * @library Mikit Message
 * @author Mikit
 * @license MIT
 */
(function (Mikit) {
    Mikit.Message = function (element, options) {
        this.namespace = 'message';
        this.defaults = {
            closeSelector: '.close',
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
            if (e) e.preventDefault();

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