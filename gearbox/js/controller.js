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

Ext.namespace( 'Transmission' );

(function()
{
    var that;
    var prefs;
    var session;
    var mainwin;

    function isDisplaySmall( )
    {
        return Ext.lib.Dom.getViewWidth() <= 480;
    }

    function getDialogConfig( )
    {
        var config = { };
        config.session = session;
        config.prefs = prefs;
        if( isDisplaySmall( ) )
        {
            config.width = Ext.lib.Dom.getViewWidth();
            config.height = Ext.lib.Dom.getViewHeight();
        }
        return config;
    }

    Transmission.Controller = Ext.extend( Ext.util.Observable,
    {
        showPrefs: function( )
        {
             new Transmission.PrefsDialog( getDialogConfig() ).show();
        },

        showStats: function( )
        {
             new Transmission.StatsDialog( getDialogConfig() ).show();
        },

        showOpen: function( )
        {
            new Transmission.OpenDialog( getDialogConfig() ).show();
        },

        showDetails: function( cfg )
        {
            new Transmission.Details( Ext.apply( getDialogConfig(), cfg ) ).show( );
        },

        constructor: function( config )
        {
            that = this;
            prefs = config.prefs;
            session = config.session;
            mainwin = config.mainwin;
            Transmission.Controller.superclass.constructor.call( this, config );

            mainwin.addListener( 'onStatsClicked', function() { that.showStats( ); } );
             mainwin.addListener( 'onPrefsClicked', function() { that.showPrefs( ); } );
             mainwin.addListener( 'onOpenClicked', function() { that.showOpen( ); } );
            mainwin.addListener( 'onDetailsClicked', function(cfg) { that.showDetails(cfg); } );
        }
    });
}());
