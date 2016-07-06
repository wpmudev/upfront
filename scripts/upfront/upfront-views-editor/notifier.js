(function($, Backbone){

    define([
        "text!upfront/templates/popup.html"
    ], function( popup_tpl ){

        var NotifierView = Backbone.View.extend({
            notices: new Backbone.Collection([]),
            elId: 'upfront-notice',
            timer: false,
            timeoutTime: 5000,
            $notice: false,
            tpl: _.template($(popup_tpl).find('#upfront-notifier-tpl').html()),
            initialize: function(options){
                this.notices.on('add', this.messageAdded, this);
                this.notices.on('remove', this.messageRemoved, this);

                $('body').append(this.tpl({}));

                this.setElement($('#' + this.elId));
                /*
                 // Hey admin bar!
                 var $bar = $('#wpadminbar'); // We'll use it a couple of times, so cache
                 if($bar.length && $bar.is(":visible")) // Check existence *and* visibility
                 $('#upfront-notifier').css({top: 28});
                 */
            },
            addMessage: function(message, type, duration){
                var notice = {
                    message: message ? message : l10n.no_message,
                    type: type ? type : 'info',
                    duration: duration
                };

                this.notices.add(notice);
            },
            show: function(notice) {
                var me = this;
                this.setMessage(notice);
                this.$el.addClass('notify open')
                    .removeClass('out')
                ;
                this.timer = setTimeout(function(){
                    me.notices.remove(notice);
                }, notice.get('duration') || this.timeoutTime);
            },
            replace: function(notice) {
                var me = this;
                this.setMessage(notice);
                this.timer = setTimeout(function(){
                    me.notices.remove(notice);
                }, this.timeoutTime);

                this.$el.removeClass('notify').
                addClass('shake');

                setTimeout(function(){
                    me.$el.removeClass('shake');
                }, this.timeoutTime / 2);
            },
            setMessage: function(notice) {
                this.$el.removeClass('info warning error')
                    .addClass(notice.get('type'))
                    .html(notice.get('message'))
                ;
            },
            close: function() {
                this.$el.addClass('out');
                this.$el.removeClass('notify shake open');
            },
            messageAdded: function(notice){
                if(! this.$el.hasClass('notify')){
                    this.show(notice);
                }
            },
            messageRemoved: function(notice){
                if(this.notices.length)
                    this.replace(this.notices.at(0));
                else
                    this.close();
            }
        });

        return new NotifierView();

    });

}(jQuery, Backbone));