/**
 * @library Mikit Tab
 * @author Mikit
 * @license MIT
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