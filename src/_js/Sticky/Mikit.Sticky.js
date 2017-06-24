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