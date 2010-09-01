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
    var mySession = null;
    var that = null;

    function addToPrefs( o )
    {
    }

    function onStatsChanged( o )
    {
        var sub = o['current-stats'];
        var prefix = 'current-session-';
        var e;
        e = Ext.getCmp( prefix+'uploadedBytes' )
        e.update( Transmission.fmt.size( sub.uploadedBytes ) );
        if( e.disabled ) e.enable( );
        e = Ext.getCmp( prefix+'downloadedBytes' );
        e.update( Transmission.fmt.size( sub.downloadedBytes ) );
        if( e.disabled ) e.enable( );
        e = Ext.getCmp( prefix+'duration' );
        e.update( Transmission.fmt.timeInterval( sub.secondsActive ) );
        if( e.disabled ) e.enable( );
        e = Ext.getCmp( prefix+'ratio' );
        e.update( Transmission.fmt.ratioString(Math.ratio(sub.uploadedBytes,sub.downloadedBytes)));
        if( e.disabled ) e.enable( );

        sub = o['cumulative-stats'];
        prefix = 'cumulative-';
        e = Ext.getCmp( prefix+'uploadedBytes' )
        e.update( Transmission.fmt.size( sub.uploadedBytes ) );
        if( e.disabled ) e.enable( );
        e = Ext.getCmp( prefix+'downloadedBytes' );
        e.update( Transmission.fmt.size( sub.downloadedBytes ) );
        if( e.disabled ) e.enable( );
        e = Ext.getCmp( prefix+'duration' );
        e.update( Transmission.fmt.timeInterval( sub.secondsActive ) );
        if( e.disabled ) e.enable( );
        e = Ext.getCmp( prefix+'ratio' );
        e.update( Transmission.fmt.ratioString(Math.ratio(sub.uploadedBytes,sub.downloadedBytes)));
        if( e.disabled ) e.enable( );
        e = Ext.getCmp( prefix+'times-run' );
        e.update( '' + sub.sessionCount );
        if( e.disabled ) e.enable( );
    }

    Transmission.StatsDialog = Ext.extend( Ext.Window, {

        close: function( )
        {
            mySession.removeListener( 'onStatsChanged', onStatsChanged );    
            Transmission.StatsDialog.superclass.close.call( this );
        },

        constructor: function( config )
        {
            that = this;
            Ext.applyIf( config, {
                layout: 'form',
                title: 'Statistics',
                bodyCssClass: 'hig-body',
                width: 350,
                items: [ { xtype: 'fieldset', title: 'Current Session', cls: 'hig-fieldset', defaultType: 'label', items: [
                             { disabled: true, id: 'current-session-uploadedBytes', text: 'None', fieldLabel: 'Uploaded' },
                             { disabled: true, id: 'current-session-downloadedBytes', text: 'None', fieldLabel: 'Downloaded' },
                             { disabled: true, id: 'current-session-ratio', text: 'None', fieldLabel: 'Ratio' },
                             { disabled: true, id: 'current-session-duration', text: 'None', fieldLabel: 'Duration' } ] },
                         { xtype: 'fieldset', title: 'Total', cls: 'hig-fieldset', defaultType: 'label', items: [
                             { disabled: true, id: 'cumulative-times-run', text: '0', fieldLabel: 'Times started' },
                             { disabled: true, id: 'cumulative-uploadedBytes', text: 'None', fieldLabel: 'Uploaded' },
                             { disabled: true, id: 'cumulative-downloadedBytes', text: 'None', fieldLabel: 'Downloaded' },
                             { disabled: true, id: 'cumulative-ratio', text: 'None', fieldLabel: 'Ratio' },
                             { disabled: true, id: 'cumulative-duration', text: 'None', fieldLabel: 'Duration' } ] }
                        ]
            } );
            Transmission.StatsDialog.superclass.constructor.call( this, config );
            mySession = config.session;
            mySession.addListener( 'onStatsChanged', onStatsChanged );    
        }
    });
}());

