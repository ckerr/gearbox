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

Transmission.Details = Ext.extend( Ext.Window, {

    mySession: null,
    fileTab: null,
    trackerTab: null,
    torrentId: -1,

    refresh: function( record )
    {
        var e;
        var text;
        var rec = record;
        var na = 'N/A';
        var none = 'None';

        this.fileTab.refresh( record );
        this.trackerTab.refresh( record );

        // SIZE
        e = Ext.getCmp( 'details-size-label' );
        text = String.format( '{0} ({1} @ {2})',
                Transmission.fmt.size( rec.totalSize() ),
                Ext.util.Format.plural( rec.getPieceCount(), 'Piece' ),
                Transmission.fmt.size( rec.getPieceSize() ) );
        e.setValue( text );

        // HAVE
        e = Ext.getCmp( 'details-have-label' );
        text = '';
        if( !rec.isMagnet( ) )
        {
            var sizeWhenDone = rec.sizeWhenDone( );
            var leftUntilDone = rec.leftUntilDone( );
            var unchecked = rec.haveUnchecked( );
            var valid = rec.haveValid( );
            var d = 100.0 * ( sizeWhenDone ? ( sizeWhenDone - leftUntilDone ) / sizeWhenDone : 1 );

            text = String.format( '{0} ({1}%)',
                    Transmission.fmt.size( valid + unchecked ),
                    Transmission.fmt.percentString( d ) );
            if( unchecked )
                text += String.format( '; {0} Unverified', Transmission.fmt.size( unchecked ) );
        }
        e.setValue( text );

        // AVAILABILITY
        e = Ext.getCmp( 'details-availability-label' );
        if( rec.sizeWhenDone() == 0 )
            text = none;
        else {
            var available = rec.sizeWhenDone() - rec.leftUntilDone() + rec.desiredAvailable();
            text = String.format( '{0}%', Transmission.fmt.percentString( ( 100.0 * available ) / rec.sizeWhenDone() ) );
        }
        e.setValue( text );
        
        // DOWNLOADED
        e = Ext.getCmp( 'details-downloaded-label' );
        var d = rec.downloadedEver( );
        var c = rec.corruptEver( );
        var dstr = Transmission.fmt.size( d );
        var cstr = Transmission.fmt.size( c );
        if( c )
            text = String.format( '{0} (+{1} corrupt)', dstr, cstr );
        else
            text = dstr;
        e.setValue( text );

        // UPLOADED
        e = Ext.getCmp( 'details-uploaded-label' );
        text = Transmission.fmt.size( rec.uploadedEver( ) );
        e.setValue( text );
    
        // RATIO    
        e = Ext.getCmp( 'details-ratio-label' );
        text = Transmission.fmt.ratioString( rec.uploadRatio( ) );
        e.setValue( text );

        // STATE    
        e = Ext.getCmp( 'details-state-label' );
        text = rec.getActivityString( );
        e.setValue( text );

        // RUNNING TIME    
        e = Ext.getCmp( 'details-running-time-label' );
        if( rec.isPaused( ) )
            text = na;
        else
            text = Transmission.fmt.timeInterval( rec.runningTime( ) );
        e.setValue( text );

        // REMAINING TIME    
        e = Ext.getCmp( 'details-remaining-time-label' );
        if( rec.isDone( ) )
            text = na;
        else if( rec.hasETA( ) )
            text = 'Unknown';
        else
            text = Transmission.fmt.timeInterval( rec.runningTime( ) );
        e.setValue( text );

        // LAST ACTIVITY    
        e = Ext.getCmp( 'details-last-activity-label' );
        if( !rec.lastActivityAt( ) )
            text = na;
        else
            text = Transmission.fmt.timeInterval( rec.timeSinceLastActivity( ) );
        e.setValue( text );

        // ERROR    
        e = Ext.getCmp( 'details-error-label' );
        if( rec.hasError( ) )
            text = rec.getError( );
        else
            text = none;
        e.setValue( text );
    },

    createInfoTab: function( )
    {
        return new Ext.FormPanel( { title: 'Activity', bodyCssClass: 'hig-body', items: [
            { xtype: 'displayfield', id: 'details-size-label', fieldLabel: 'Torrent-size' },
            { xtype: 'displayfield', id: 'details-have-label', fieldLabel: 'Have' },
            { xtype: 'displayfield', id: 'details-availability-label', fieldLabel: 'Availability' },
            { xtype: 'displayfield', id: 'details-downloaded-label', fieldLabel: 'Downloaded' },
            { xtype: 'displayfield', id: 'details-uploaded-label', fieldLabel: 'Uploaded' },
            { xtype: 'displayfield', id: 'details-ratio-label', fieldLabel: 'Ratio' },
            { xtype: 'displayfield', id: 'details-state-label', fieldLabel: 'State' },
            { xtype: 'displayfield', id: 'details-running-time-label', fieldLabel: 'Running Time' },
            { xtype: 'displayfield', id: 'details-remaining-time-label', fieldLabel: 'Remaining Time' },
            { xtype: 'displayfield', id: 'details-last-activity-label', fieldLabel: 'Last Activity' },
            { xtype: 'displayfield', id: 'details-error-label', fieldLabel: 'Error' }
        ]});
    },

    createPeerTab: function( rec )
    {
        return new PeerView( { title: 'Peers', record: rec } );
    },

    createTrackerTab: function( rec )
    {
        return new TrackerView( { title: 'Trackers', record: rec, session: this.mySession, prefs: this.myPrefs } );
    },

    createFileTab: function( rec )
    {
        return new FileView( { title: 'Files', record: rec, session: this.mySession } );
    },

    createOptionTab: function( )
    {
        return new Ext.FormPanel( { title: 'Options', bodyCssClass: 'hig-body', items: [
            { xtype: 'fieldset', title: 'Speed', cls: 'hig-fieldset', items: [
            ]},
            { xtype: 'fieldset', title: 'Seeding Limits', cls: 'hig-fieldset', items: [
            ]},
            { xtype: 'fieldset', title: 'Peer Connections', cls: 'hig-fieldset', items: [
            ]}
        ]});
    },

    createWorkArea: function( rec )
    {
        this.fileTab = this.createFileTab( rec );
        this.trackerTab = this.createTrackerTab( rec );

        var tabs = [ this.createInfoTab( ),
                     this.createPeerTab( rec ),
                     this.trackerTab,
                     this.fileTab,
                     this.createOptionTab( ) ];

        return new Ext.TabPanel( { activeTab: 0, height: 333, autoWidth: true, items: tabs } );
    },

    onTorrentUpdated: function( store, record, operation )
    {
        if( this.torrentId == record.getId() )
            this.refresh( record );
    },

    close: function( )
    {
        clearInterval( this.timer );
        Torrent.store.removeListener( 'update', this.onTorrentUpdated, this );
        Transmission.Details.superclass.close.call( this );
    },

    constructor: function( config_in )
    {
        var that = this;
        var record = config_in.record;
        this.mySession = config_in.session;
        this.torrentId = record.getId( );

        this.myPrefs = config_in.prefs;
        var config = Ext.apply( { }, config_in, {
            width: 433,
            height: 380,
            cls: 'hig-dialog',
            title: record.getName( ),
            layout: 'fit',
            items: this.createWorkArea( record )
        } );

        Transmission.Details.superclass.constructor.call( this, config );
        Torrent.store.addListener( 'update', this.onTorrentUpdated, this );
        var ids = [ this.torrentId ];
        this.timer = setInterval( function() { that.mySession.updateExtraStats( ids ); }, 5000 );
        this.mySession.updateExtraStats( ids );
        this.refresh( config_in.record );
    }
});
