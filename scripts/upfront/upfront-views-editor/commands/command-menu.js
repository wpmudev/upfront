(function($){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
			? Upfront.Settings.l10n.global.views
			: Upfront.mainData.l10n.global.views
		;
	define([
		'scripts/upfront/upfront-views-editor/commands/command',
		'scripts/upfront/upfront-views-editor/commands/commands',
		'scripts/upfront/upfront-views-editor/commands/menu/command-close',
		'scripts/upfront/upfront-views-editor/commands/menu/command-wpadmin',
		'scripts/upfront/upfront-views-editor/commands/menu/command-help',
	], function ( Command, Commands, Command_Close, Command_WPAdmin, Command_Help ) {

		var Menu = Commands.extend({
			className: "command-more-menu-list",
			initialize: function () {
				this.commands = _([
					new Command_Close({"model": this.model}),
					new Command_WPAdmin({"model": this.model}),
					new Command_Help({"model": this.model})
				]);
			}
		});

		return Command.extend({
			className: "command-more-menu",
			initialize: function () {
				this.menu = new Menu({"model": this.model});
				this.opened = false;
			},
			render: function () {
				this.menu.render();
				this.$el.html('<i class="upfront-icon upfront-icon-more-menu"></i>');
				this.$el.append(this.menu.el);
				$(document).off('click.more_menu');
				$(document).on('click.more_menu', this, this.on_document_click);
			},
			on_click: function () {
				this.toggle_menu();
				// Make sure each menu event is bound
				this.menu.commands.each(function(command){
					command.delegateEvents();
				});
			},
			on_document_click: function (e) {
				var $target = $(e.target),
					me = e.data
				;
				if ( $target.closest(me.$el).length > 0 || $target.is(me.$el) ) return;
				me.close_menu();
			},
			toggle_menu: function () {
				if ( this.opened ) this.close_menu();
				else this.open_menu();
			},
			open_menu: function () {
				this.$el.addClass('menu-open');
				this.$el.find('.upfront-icon-more-menu').addClass('upfront-icon-more-menu-active');
				this.opened = true;
				Upfront.Events.trigger('upfront:more_menu:open');
			},
			close_menu: function () {
				this.$el.removeClass('menu-open');
				this.$el.find('.upfront-icon-more-menu').removeClass('upfront-icon-more-menu-active');
				this.opened = false;
				Upfront.Events.trigger('upfront:more_menu:close');
			}
		});

	});
}(jQuery));