/**
 * Gearbox: a Web GUI for Transmission
 * 
 * Copyright (c) Mnemosyne LLC
 *
 * This program is free software; you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 2
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 */

Transmission.Controller = Ext.extend( Ext.util.Observable,
{
    prefs : null,
    session : null,

    isDisplaySmall : function(){
        return Ext.lib.Dom.getViewWidth() <= 480;
    },

    getDialogConfig : function(){
        var config = { session: this.session, prefs: this.prefs };
        if( this.isDisplaySmall() ) {
            config.width = Ext.lib.Dom.getViewWidth();
            config.height = Ext.lib.Dom.getViewHeight();
        }
        return config;
    },

    showPrefs : function(){
        var me = this;
        if(!me.prefsDialog){
            me.prefsDialog = new Transmission.PrefsDialog(me.getDialogConfig());
            me.prefsDialog.addListener('close', function(){me.prefsDialog=null;});
        }
        me.prefsDialog.show();
        me.prefsDialog.focus();
    },

    showStats : function(){
        var me = this;
        if(!me.statsDialog){
            me.statsDialog = new Transmission.StatsDialog(me.getDialogConfig());
            me.statsDialog.addListener('close', function(){me.statsDialog=null;});
        }
        me.statsDialog.show();
        me.statsDialog.focus();
    },

    showOpen : function() {
        var me = this;
        if(!me.openDialog){
            me.openDialog = new Transmission.OpenDialog(me.getDialogConfig());
            me.openDialog.addListener('close',function(){me.openDialog=null;});
        }
        me.openDialog.show();
        me.openDialog.focus();
    },

    showDetails : function(cfg){
        var me = this;
        if(me.detailsDialog)
            me.detailsDialog.close(); // FIXME: reuse the same dialog?
        me.detailsDialog = new Transmission.Details(Ext.apply(me.getDialogConfig(),cfg));
        me.detailsDialog.addListener('close',function(){me.detailsDialog=null;});
        me.detailsDialog.show();
        me.detailsDialog.focus();
    },

    constructor : function(config){
        var mainwin = config.mainwin;

        this.prefs = config.prefs;
        this.session = config.session;
        this.superclass().constructor.call( this, config );

        mainwin.addListener( 'onStatsClicked', this.showStats, this );
        mainwin.addListener( 'onPrefsClicked', this.showPrefs, this );
        mainwin.addListener( 'onOpenClicked', this.showOpen, this );
        mainwin.addListener( 'onDetailsClicked', this.showDetails, this );
    }
});
