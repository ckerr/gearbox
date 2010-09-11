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
        var text;
        var rec = record;
        var tor = record.data;
        var na = 'N/A';
        var none = 'None';

        this.fileTab.refresh( record );
        this.trackerTab.refresh( record );

        // SIZE
        text = String.format( '{0} ({1} @ {2})',
                Transmission.fmt.size( rec.totalSize() ),
                Ext.util.Format.plural( rec.getPieceCount(), 'Piece' ),
                Transmission.fmt.size( rec.getPieceSize() ) );
        this.sizeLabel.setValue( text );

        // HAVE
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
        this.haveLabel.setValue( text );

        // AVAILABILITY
        if( rec.sizeWhenDone() == 0 )
            text = none;
        else {
            var available = rec.sizeWhenDone() - rec.leftUntilDone() + rec.desiredAvailable();
            text = String.format( '{0}%', Transmission.fmt.percentString( ( 100.0 * available ) / rec.sizeWhenDone() ) );
        }
        this.availabilityLabel.setValue( text );
        
        // DOWNLOADED
        var d = rec.downloadedEver( );
        var c = rec.corruptEver( );
        var dstr = Transmission.fmt.size( d );
        var cstr = Transmission.fmt.size( c );
        if( c )
            text = String.format( '{0} (+{1} corrupt)', dstr, cstr );
        else
            text = dstr;
        this.downloadedLabel.setValue( text );

        // UPLOADED
        text = Transmission.fmt.size( rec.uploadedEver( ) );
        this.uploadedLabel.setValue( text );
    
        // RATIO    
        text = Transmission.fmt.ratioString( rec.uploadRatio( ) );
        this.ratioLabel.setValue( text );

        // STATE    
        text = rec.getActivityString( );
        this.stateLabel.setValue( text );

        // RUNNING TIME    
        if( rec.isPaused( ) )
            text = na;
        else
            text = Transmission.fmt.timeInterval( rec.runningTime( ) );
        this.runningTimeLabel.setValue( text );

        // REMAINING TIME    
        if( rec.isDone( ) )
            text = na;
        else if( rec.hasETA( ) )
            text = 'Unknown';
        else
            text = Transmission.fmt.timeInterval( rec.runningTime( ) );
        this.remainingTimeLabel.setValue( text );

        // LAST ACTIVITY    
        if( !rec.lastActivityAt( ) )
            text = na;
        else
            text = Transmission.fmt.timeInterval( rec.timeSinceLastActivity( ) );
        this.lastActivityLabel.setValue( text );

        // ERROR    
        if( rec.hasError( ) )
            text = rec.getError( );
        else
            text = none;
        this.errorLabel.setValue( text );

        // LOCATION
        this.locationLabel.setValue( tor.downloadDir );

        // HASH
        this.hashLabel.setValue( tor.hashString );

        // PRIVACY
        text = tor.isPrivate ? 'Private to this tracker -- DHT and PEX disabled' : 'Public torrent';
        this.privacyLabel.setValue( text );

        // ORIGIN
        text = [ 'Created by ', tor.creator, ' on ', Transmission.fmt.timestamp( tor.dateCreated ) ].join( '' );
        this.originLabel.setValue( text );

        // COMMENT
        this.commentLabel.setValue( tor.comment );
    },

    createInfoTab: function( )
    {
        var idSuffix = '-' + Math.floor( Math.random() * 10000000 );
        var sizeLabelId           = 'details-size-label' + idSuffix;
        var haveLabelId           = 'details-have-label' + idSuffix;
        var availabilityLabelId   = 'details-availability-label' + idSuffix;
        var downloadedLabelId     = 'details-downloaded-label' + idSuffix;
        var uploadedLabelId       = 'details-uploaded-label' + idSuffix;
        var ratioLabelId          = 'details-ratio-label' + idSuffix;
        var stateLabelId          = 'details-state-label' + idSuffix;
        var runningTimeLabelId    = 'details-running-time-label' + idSuffix;
        var remainingTimeLabelId  = 'details-remaining-time-label' + idSuffix;
        var lastActivityLabelId   = 'details-last-activity-label' + idSuffix;
        var errorLabelId          = 'details-error-label' + idSuffix;
        var locationLabelId       = 'details-location-label' + idSuffix;
        var hashLabelId           = 'details-hash-label' + idSuffix;
        var privacyLabelId        = 'details-privacy-label' + idSuffix;
        var originLabelId         = 'details-origin-label' + idSuffix;
        var commentLabelId        = 'details-comment-label' + idSuffix;

        var panel = new Ext.FormPanel( { title: 'Info', bodyCssClass: 'hig-body', autoScroll: true,  items: [
            { xtype: 'fieldset', title: 'Activity', cls: 'hig-fieldset', autoWidth: true, items: [
                { xtype: 'displayfield', id: sizeLabelId, fieldLabel: 'Torrent-size' },
                { xtype: 'displayfield', id: haveLabelId, fieldLabel: 'Have' },
                { xtype: 'displayfield', id: availabilityLabelId, fieldLabel: 'Availability' },
                { xtype: 'displayfield', id: downloadedLabelId, fieldLabel: 'Downloaded' },
                { xtype: 'displayfield', id: uploadedLabelId,  fieldLabel: 'Uploaded' },
                { xtype: 'displayfield', id: ratioLabelId, fieldLabel: 'Ratio' },
                { xtype: 'displayfield', id: stateLabelId,  fieldLabel: 'State' },
                { xtype: 'displayfield', id: runningTimeLabelId, fieldLabel: 'Running Time' },
                { xtype: 'displayfield', id: remainingTimeLabelId, fieldLabel: 'Remaining Time' },
                { xtype: 'displayfield', id: lastActivityLabelId, fieldLabel: 'Last Activity' },
                { xtype: 'displayfield', id: errorLabelId, fieldLabel: 'Error' }
            ] },
            { xtype: 'fieldset', title: 'Details', cls: 'hig-fieldset', autoWidth: true, items: [
                { xtype: 'displayfield', id: locationLabelId, fieldLabel: 'Location' },
                { xtype: 'displayfield', id: hashLabelId, fieldLabel: 'Hash' },
                { xtype: 'displayfield', id: privacyLabelId, fieldLabel: 'Privacy' },
                { xtype: 'displayfield', id: originLabelId, fieldLabel: 'Origin' },
                { xtype: 'displayfield', id: commentLabelId, fieldLabel: 'Comment' }
            ] }
        ]});

        this.sizeLabel          = Ext.getCmp( sizeLabelId );
        this.haveLabel          = Ext.getCmp( haveLabelId );
        this.availabilityLabel  = Ext.getCmp( availabilityLabelId  );
        this.downloadedLabel    = Ext.getCmp( downloadedLabelId );
        this.uploadedLabel      = Ext.getCmp( uploadedLabelId );
        this.ratioLabel         = Ext.getCmp( ratioLabelId );
        this.stateLabel         = Ext.getCmp( stateLabelId );
        this.runningTimeLabel   = Ext.getCmp( runningTimeLabelId );
        this.remainingTimeLabel = Ext.getCmp( remainingTimeLabelId );
        this.lastActivityLabel  = Ext.getCmp( lastActivityLabelId );
        this.errorLabel         = Ext.getCmp( errorLabelId );
        this.locationLabel      = Ext.getCmp( locationLabelId );
        this.hashLabel          = Ext.getCmp( hashLabelId );
        this.privacyLabel       = Ext.getCmp( privacyLabelId );
        this.originLabel        = Ext.getCmp( originLabelId );
        this.commentLabel       = Ext.getCmp( commentLabelId );

        return panel;
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

    destroy: function( )
    {
        clearInterval( this.timer );
        Torrent.store.removeListener( 'update', this.onTorrentUpdated, this );
        Transmission.Details.superclass.destroy.call( this );
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
