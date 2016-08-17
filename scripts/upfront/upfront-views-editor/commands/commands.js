(function(){
	var l10n = Upfront.Settings && Upfront.Settings.l10n
			? Upfront.Settings.l10n.global.views
			: Upfront.mainData.l10n.global.views
		;
	define(function () {
		return Backbone.View.extend({
			"tagName": "ul",

			initialize: function () {
				this.commands = _([]);
			},
			render: function () {
				this.$el.find("li").remove();
				this.commands.each(this.add_command, this);
			},

			add_command: function (command) {
				if (!command) return;
				command.remove();
				command.render();
				this.$el.append(command.el);
				command.bind("upfront:command:remove", this.remove_command, this);
				command.delegateEvents();
			},

			remove_command: function (to_remove) {
				var coms = this.commands.reject(function (com) {
						com.remove();
						return com.cid == to_remove.cid;
					})
				;
				this.commands = _(coms);
				this.render();
			}
		});

	});
})();
