var db;
var watchID = null;
var gps = false;
var acc = 0;
var lineid = 1;
var tempId;
var R = 6371; // earth's radius in km
var accuracy;
var track = false;
var lat;
var lon;
var rows = 0;

display = true;

var line = "";
var multi = "";

var mLine;
var mPoint;

var points = "";
var multiids = new Array();
var pointids = new Array();
var rPoint = new Array();

var wkt;

var mark;

var iDmarker = 0;
var stringStatus;

var iDm = 0;

$(document).ready(
            function() {
              
              $.blockUI({
                message : '<h4><img src="images/ajax-loader.gif" /><br/>Loading Database...</h4>',
                css : {
                  top : ($(window).height()) / 3 + 'px',
                  left : ($(window).width() - 200) / 2 + 'px', width : '200px',
                  backgroundColor : '#33CCFF', '-webkit-border-radius' : '10px',
                  '-moz-border-radius' : '10px', color : '#FFFFFF', border : 'none'
                }
              });
              
              
              
              // Wait for PhoneGap to load
              document.addEventListener("deviceready", onDeviceReady, false);
              
              $("#stat").html("Standby");
              
              $("#stop").hide();
              
              $( "#progressbar" ).hide('slow');
            });

$("#redo").live("click", function(event, ui) {
  
  redoRecord();
  countDB();
  countUpload();
});

$("#start")
.bind(
            "click",
            function(event, ui) {
              
              $("#start").hide();
              $("#stop").show();
              
              $("#upDiv").hide();
              
              gps = true
              if(watchID == null) {
                var options = {
                            enableHighAccuracy : true, maximumAge : 5000, timeout : 5000
                };
                watchID = navigator.geolocation.watchPosition(onSuccess, onError,
                            options);
              }
              
              lineid = lineid + 1;
              window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, createLine,
                          failLineCreate);
              
              $("#stat")
              .empty()
              .html("<p id='initial'>Please wait, improving GPS Accuracy <a id='accy'></a>...</p>");
              
            });

$("#stop").bind("click", function(event, ui) {
  
  $("#stop").hide();
  $("#start").show();
  
  $("#upDiv").show();
  
  gps = false;
  
  track = false;
  clearWatch();
  $("#stat").empty().html("<p id='stopped'>Stopped Tracking</p>");
  
});

$("#saveSettings").bind("click", function(event, ui) {
  
  $.mobile.showToast("Saving ...", 1000, function() {
    
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, saveSettings, failsaveSettings);
  });
  
});

$("#settings").live("click", function(event, ui) {
  
  $.mobile.changePage("#page_login", "slide", true, false);
});

$("#about").live("click", function(event, ui) {
  
  $.mobile.changePage("#page_about", "slide", true, false);
});

$("#page_login").live("pageshow", function(event, ui) {
  
  if(localStorage.batch != undefined && localStorage.accuracy != undefined) {
    $("#batch").val(parseInt(localStorage.batch, 10)).slider("refresh");
    $("#accuracy").val(parseInt(localStorage.accuracy, 10)).slider("refresh");
    
  }
  
});

$("#reset").live("click", function(event, ui) {
  
  $.mobile.showToast("Reseting Bucket...", 3000, function() {
    
    loginStatus().then(function() {
      
      logout();
    });
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, deleteAnony, failDeleteAnony);
    clearTable();
    countUpload();
    countDB();
    $.mobile.changePage("#page_home", "slide", true, false);
  });
});

$("#check").live(
            "click",
            function(event, ui) {
              
              if($("#username").val().length > 0 && $("#pass").val().length > 0) {
                var u = $("#username").val();
                var p = $("#pass").val();
                
                $.blockUI({
                  message : '<h4><img src="images/ajax-loader.gif" /><br/>Signing In...</h4>',
                  css : {
                    top : ($(window).height()) / 3 + 'px',
                    left : ($(window).width() - 200) / 2 + 'px', width : '200px',
                    backgroundColor : '#33CCFF', '-webkit-border-radius' : '10px',
                    '-moz-border-radius' : '10px', color : '#FFFFFF', border : 'none'
                  }
                });
                
                loginStatus().then(function() {
                  
                  alert("You are already logged in");
                  $.unblockUI();
                }).fail(
                            function(h) {
                              
                              if(localStorage.usr != "0" && localStorage.psw != "0" &&
                                          localStorage.usr != undefined &&
                                          localStorage.psw != undefined)
                              {
                                login(localStorage.usr, localStorage.psw).then(function(g) {
                                  
                                  $.unblockUI();
                                  
                                });
                              }
                              else {
                                
                                login(u, p).then(function(x) {
                                  
                                  alert(x);
                                  $.unblockUI();
                                }).fail(function(h) {
                                  
                                 // alert(h);
                                  $.unblockUI();
                                  
                                });
                              }
                            });
              }
              else {
                alert("Please Enter Username and Password");
                
              }
            });

$("#upload")
.live(
            "click",
            function(event, ui) {
              
              var networkState = navigator.network.connection.type;
              var states = {};
              
              states[Connection.UNKNOWN] = 'Unknown connection';
              states[Connection.ETHERNET] = 'Ethernet connection';
              states[Connection.WIFI] = 'WiFi connection';
              states[Connection.CELL_2G] = 'Cell 2G connection';
              states[Connection.CELL_3G] = 'Cell 3G connection';
              states[Connection.CELL_4G] = 'Cell 4G connection';
              states[Connection.NONE] = 'No network connection';
              
              if((states[networkState] == 'No network connection') ||
                          (states[networkState] == 'Unknown connection'))
              {
                alert('Please check your phone internet connection is working and Try Again.');
                
              }
              else {

                                                    
                $
                .blockUI({
                  message : '<h4><img src="images/ajax-loader.gif" /><br/>Checking Connection...</h4>',
                  css : {
                    top : ($(window).height()) / 3 + 'px',
                    left : ($(window).width() - 200) / 2 + 'px',
                    width : '200px', backgroundColor : '#33CCFF',
                    '-webkit-border-radius' : '10px',
                    '-moz-border-radius' : '10px', color : '#FFFFFF',
                    border : 'none'
                  }
                });
                               
                checkDrupalConnec()
                .then(function() {
                                    
                              checkDB()
                              .then(function(n) {

                                
                                            tempId = parseInt(
                                                        localStorage.line,
                                                        10);
                                            
                                            mLine = true;
                                            
                                            loginStatus()
                                            .then(
                                                        function() {
                                                          
                                                          $
                                                          .unblockUI();
                                                          upload();
                                                        })
                                                        .fail(
                                                                    function() {
                                                                      
                                                                      if(localStorage.usr != "0" &&
                                                                                  localStorage.psw != "0" &&
                                                                                  localStorage.usr != undefined &&
                                                                                  localStorage.psw != undefined)
                                                                      {
                                                                        $
                                                                        .ajax({
                                                                          url : "http://api.geobucket.org/?q=bucket/user/login.json",
                                                                          type : 'post',
                                                                          data : 'username=' +
                                                                          encodeURIComponent(localStorage.usr) +
                                                                          '&password=' +
                                                                          encodeURIComponent(localStorage.psw),
                                                                          dataType : 'json',
                                                                          error : function(
                                                                                      XMLHttpRequest,
                                                                                      textStatus,
                                                                                      errorThrown) {
                                                                            
                                                                            //alert('Failed to login ' +
                                                                                  //      errorThrown);
                                                                          },
                                                                          success : function(
                                                                                      data) {
                                                                            
                                                                            upload();
                                                                          }
                                                                        });
                                                                      }
                                                                      else if(localStorage.anonymous != "0" &&
                                                                                  localStorage.anonymous != undefined)
                                                                      {
                                                                        upload();
                                                                      }
                                                                      else {
                                                                        
                                                                        $(
                                                                                    '<div>')
                                                                                    .simpledialog2(
                                                                                                {
                                                                                                  mode : 'button',
                                                                                                  headerText : 'Info...',
                                                                                                  headerClose : true,
                                                                                                  buttonPrompt : "You are not logged in. Do you want to upload annonymously?",
                                                                                                  buttons : {
                                                                                                    'OK' : {
                                                                                                      click : function() {
                                                                                                        
                                                                                                        window
                                                                                                        .requestFileSystem(
                                                                                                                    LocalFileSystem.PERSISTENT,
                                                                                                                    0,
                                                                                                                    createAnonymous,
                                                                                                                    failanonymousCreate);
                                                                                                        upload();
                                                                                                      }
                                                                                                    },
                                                                                                    'Cancel' : {
                                                                                                      click : function() {
                                                                                                        
                                                                                                        window
                                                                                                        .requestFileSystem(
                                                                                                                    LocalFileSystem.PERSISTENT,
                                                                                                                    0,
                                                                                                                    deleteAnony,
                                                                                                                    failDeleteAnony);
                                                                                                        $.mobile
                                                                                                        .changePage(
                                                                                                                    "#page_login",
                                                                                                                    "slide",
                                                                                                                    true,
                                                                                                                    false);
                                                                                                      },
                                                                                                      icon : "delete",
                                                                                                      theme : "b"
                                                                                                    }
                                                                                                  }
                                                                                                });
                                                                        
                                                                        $
                                                                        .unblockUI();
                                                                      }
                                                                    });
                                          })
                                          .fail(
                                                      function() {
                                                        
                                                        //alert("No Data Left In Database.");
                                                        $.unblockUI();
                                                        
                                                      });
                                        
                            }).fail(function() {
                              
                              $.unblockUI();
                              alert("GeoBucket Site is Not Available")
                              
                            });
                                            
                
              }
            });

function redoRecord() {
  
  db.transaction(function(tx) {
    
    tx.executeSql("UPDATE gable SET submit = ? WHERE submit = ?", [ 0, 1 ], null, onDBError);
  });
}

function redoLine() {
  
  db.transaction(function(tx) {
    
    tx.executeSql("UPDATE gable SET submit = ? WHERE submit = ?", [ 0, 2 ], null, onDBError);
  });
}

function redoPoint() {
  
  db.transaction(function(tx) {
    
    tx.executeSql("UPDATE gable SET submit = ? WHERE submit = ?", [ 0, 3 ], null, onDBError);
  });
}

function checkDrupalConnec() {
  
  var d = $.Deferred();
  
  $.ajax({
    url : "http://api.geobucket.org/?q=bucket/system/connect.json", type : 'post',
    dataType : 'json', error : function(XMLHttpRequest, textStatus, errorThrown) {
      
      d.reject();
      
    }, success : function(data) {
      
      d.resolve();
    }
  });
  return d;
  
}

function upload() {
  
  var d = $.Deferred();
  var name;
  var data;
  var batchSize;
                          
  if(display == true) {
    
    $.blockUI({ 
      message: '<div align="center">Uploading Traces...</div></br><div align="center" id="percent"></div>',
      
      css: { 
        top : ($(window).height()) / 4 + 'px',
        left : ($(window).width() - 200) / 2 + 'px',
        width : '200px',  
      
      border: 'none', 
      padding: '15px', 
      backgroundColor: '#000', 
      '-webkit-border-radius': '10px', 
      '-moz-border-radius': '10px', 
      opacity: 1, 
      color: '#ffffff' 
  } 
    });

  }
 
  $( "#progressbar" ).show();
  
  display = false;
                    
                                          
  
  if(localStorage.batch != undefined && localStorage.batch != null) {
    batchSize = parseInt(localStorage.batch, 10);
  }
  else {
    batchSize = 100;
  }
  
  createTags(batchSize).then(function(tags, id, rowNumb) {
    
    if(mLine == true) {
      uploadMultiLine(tags, id, rowNumb, batchSize);
    }
    else if(mPoint == true) {
      uploadPoint(tags, id, rowNumb, batchSize);
    }
    
  }).fail(function(i, r) {
    
    if(tempId < 1 && mLine == true) {
      
      if(line != "") {
        if((line.split("(").length - 1) > 1) {
          data = "MULTILINESTRING (" + line + ")";
        }
        else {
          data = "LINESTRING " + line;
        }
        
        cleanArray(multiids);
        doSend(data).then(function() {
          
          mLine = false;
          mPoint = true;
          rows = 0;
          line = "";
          
        });
        
      }
      else {
        mLine = false;
        mPoint = true;
        tempId = parseInt(localStorage.line, 10);
        // console.log("tempId is 0 reset to: "+tempId+" mLine is
        // "+mLine+" and mPoint is "+mPoint);
        upload();
        
      }
      
    }
    else if(tempId >= 1 && mLine == true) {
      
      // alert("tempId is "+tempId);
      tempId = tempId - 1;
      upload();
      
    }
    else if(mPoint == true && r == "No Points Found") {
      
      checkDB().then(function(ro) {
        
        mPoint = false;
        mLine = true;
        tempId = parseInt(localStorage.line, 10);
        upload();
        
      }).fail(function() {
        
        alert("Upload Complete");
        $( "#progressbar" ).hide('slow');
        $( "#percent" ).hide();
        display = true;
        $( "#progressbar" ).progressbar({ value: 0 });
        countDB();
        countUpload();
        $.unblockUI();
        
      });
    }
    
  });
  
}

function clearSubmitted(linestring) {
  
  var d = $.Deferred();
  // alert("Inside clearSubmitted. mPoint="+mPoint+" and mLine="+mLine);
  // alert("linestring is "+linestring);
  
  if(mPoint == true) {
    
    for( var x = 0; x < pointids.length; x++) {
      for( var l = 0; l < rPoint.length; l++) {
        if(rPoint[l] == pointids[x]) {
          
          // alert("Cleared points array: "+pointids[x]);
          updateRecord(pointids[x]);
          removeByIndex(pointids, x);
        }
      }
      
    }
    d.resolve();
    iDM = 0;
  }
  else if(linestring.indexOf("MULTILINESTRING") != -1 || linestring.indexOf("LINESTRING") != -1) {
    
    // alert("inside clear lines. multiids is "+multiids.length);
    
    for( var y = 0; y < multiids.length; y++) {
      updateRecord(multiids[y]);
      // alert("Cleared linestring array "+multiids[y]);
    }
    
    multiids = [];
    iDmarker = 0;
    
    d.resolve();
  }
  
  return d;
  
}

function uploadMultiLine(tags, id, rowNumb, batchSize) {
  
  var data;
  id = parseInt(id, 10);
  rowNumb = parseInt(rowNumb, 10);
  batchSize = parseInt(batchSize, 10);
  
  if(line == "") {
    line = tags + line;
  }
  else {
    line = tags + "," + line;
  }
  
  // alert("linetags are "+line);
  // alert("rows are "+rowNumb+" and batchSize is "+batchSize);
  
  if(rowNumb > batchSize) {
    
    if((line.split("(").length - 1) > 1) {
      data = "MULTILINESTRING (" + line + ")";
    }
    else {
      data = "LINESTRING " + line;
    }
    
    cleanArray(multiids);
    
    doSend(data).then(function() {
      
      mLine = false;
      mPoint = true;
      rows = 0;
      line = "";
      
    });
    
  }
  else if(id < 1) {
    
    if(line != "") {
      if((line.split("(").length - 1) > 1) {
        data = "MULTILINESTRING (" + line + ")";
      }
      else {
        data = "LINESTRING " + line;
      }
      
      cleanArray(multiids);
      
      doSend(data).then(function() {
        
        mLine = false;
        mPoint = true;
        rows = 0;
        line = "";
        
      });
      
    }
    else {
      upload();
    }
    
  }
  else if(id >= 1) {
    
    tempId = tempId - 1;
    upload();
  }
  
}

function uploadPoint(tags, id, rowNumb, batchSize) {
  
  var data = "";
  var dataLen = tags.length;
  
  if(tags.charAt(dataLen - 2) == ",") {
    tags = tags.slice(0, -2) + ")";
    
  }
  
  if((tags.split(",").length - 1) > 0) {
    data = "MULTIPOINT " + tags;
  }
  else {
    data = "POINT " + tags;
  }
  
  doSend(data).then(function() {
    
    mLine = true;
    mPoint = false;
    
  });
  
}

function doSend(t) {
  
  var d = $.Deferred();
  
  sendData(t).then(function(g) {
    
    clearSubmitted(g).then(function() {
      //alert("You Uploaded: "+g);
      
      progressStatus().then(function(q,f){
        //alert("The progress is "+q);
        q = parseInt(q,10);
        
        $( "#progressbar" ).progressbar( "value", q );
        $( "#percent" ).html(q+" %");
        countUpload();
        
        checkDB().then(function(c) {
          
          tempId = parseInt(localStorage.line, 10);
          upload();
          
        }).fail(function(r) {
          
          alert("Upload Complete");
          $( "#progressbar" ).hide('slow');
          $( "#percent" ).hide();
          $( "#progressbar" ).progressbar({ value: 0 });
          display = true;
          countDB();
          countUpload();
          
          mPoint = false;
          mLine = true;
          $.unblockUI();
          
        });
        
        d.resolve();
        
        
      });
     
      
    });
    
  }).fail(function(err) {
    
   // alert("Data Not Uploaded: " + err);
    if(mLine == true) {
      redoLine();
    }
    else if(mPoint == true) {
      redoPoint();
    }
    
    $.unblockUI();
    
  });
  
  return d;
}

function sendData(tags) {
  
  var d = $.Deferred();
  var title = "GeoBucket";
  // BEGIN: drupal services node create login
  // (warning: don't use https if
//you
//don't have ssl setup)
                      
  $.ajax({
    url : "http://api.geobucket.org/bucket.org/?q=bucket/node.json",
    type : 'post',
    data : 'node[type]=geobuckettype&node[title]=' + encodeURIComponent(title) +
    '&node[language]=und&node[field_gpstrace][und][0][wkt]=' +
    encodeURIComponent(tags), dataType : 'json',
    error : function(XMLHttpRequest, textStatus, errorThrown) {
      
      d.reject(errorThrown);
      
    }, success : function(data) {
      
      d.resolve(tags);
      
    }
  });
  
  // END: drupal services node create
   d.resolve(tags);
  
  return d;
}

//PhoneGap is ready
function onDeviceReady() {
  
  $.unblockUI();
  var shortName = 'geoe';
  var version = '1.0';
  var displayName = 'geoe';
  var maxSize = 500000;
  db = openDatabase(shortName, version, displayName, maxSize);
  db.transaction(function(transaction) {
    
    transaction.executeSql('CREATE TABLE IF NOT EXISTS gable '
                + ' (id INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT, '
                + ' lat FLOAT(5) NOT NULL, lon FLOAT(5) NOT NULL, '
                + ' tim INTEGER NOT NULL, submit INTEGER NOT NULL, lineId INTEGER NOT NULL);');
  });
  
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, readPass, failreadPass);
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, readAnonymous, failAnonymousread);
  
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, readSettings, failSettings);
  
  window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, readLine, failLineread);
  
  tempId = parseInt(localStorage.line, 10);
  
  if(localStorage.line == undefined) {
    localStorage.line = 1;
  }
  else {
    lineid = parseInt(localStorage.line, 10);
  }
  
  countDB();
  countUpload();
  
  var options = {
              enableHighAccuracy : true, timeout : 5000, maximumAge : 5000
  };
  
  watchID = navigator.geolocation.watchPosition(onSuccess, onError, options);
}

//onSuccess Geolocation
function onSuccess(position) {
  
  if(localStorage.accuracy != undefined) {
    accuracy = parseInt(localStorage.accuracy, 10);
    
  }
  else {
    accuracy = 90;
  }
  acc = position.coords.accuracy;
  
  if(localStorage.lat != undefined && localStorage.lon != undefined) {
    
    if(gps == true && acc <= accuracy) {
      
      compareCoords(localStorage.lat, localStorage.lon, position.coords.latitude,
                  position.coords.longitude)
                  .then(
                              function(a, b, c, d) {
                                                          
                                var m = calcDist(localStorage.lat, position.coords.latitude,
                                            localStorage.lon, position.coords.longitude);
                                
                                if(m >= 5.0) {
                                                                  
                                  localStorage.lat = c;
                                  localStorage.lon = d;
                                  
                                  lat = Math.round(c * 100000) / 100000;
                                  lon = Math.round(d * 100000) / 100000;
                                  
                                  track = true;
                                  
                                  saveCoords(lat, lon, position.timestamp, lineid);
                                  countDB();
                                  $("#stat").empty().html(
                                              "<p id='track'>Now Tracking Points (Accuracy: " +
                                              acc + "m)</p>");
                                }
                                
                              });
      
    }
    else if(gps == true && acc > accuracy) {
      
      if(track == true) {
        
        lineid = lineid + 1;
        window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, createLine, failLineCreate);
        
        track = false;
        
      }
      
      $("#stat").empty().html(
      "<p id='initial'>Please wait, improving GPS Accuracy <a id='accy'></a>...</p>");
      $("#accy").empty().html("(" + acc + "m) to atleast " + accuracy + " meters.");
      
    }
    
  }
  else {
    if(gps == true && position.coords.accuracy <= accuracy) {
      localStorage.lat = position.coords.latitude;
      localStorage.lon = position.coords.longitude;
      
      lat = Math.round(position.coords.latitude * 100000) / 100000;
      lon = Math.round(position.coords.longitude * 100000) / 100000;
      
      track = true;
      saveCoords(lat, lon, position.timestamp, lineid);
      countDB();
      $("#stat").empty().html("<p id='track'>Now Tracking Points (Accuracy: " + acc + "m)</p>");
      
    }
    
  }
  
}

function compareCoords(lat1, lon1, lat2, lon2) {
  
  var d = $.Deferred()
  lat2 = lat2 + "";
  lon2 = lon2 + "";
  
  if(lat1 == lat2 && lon1 == lon2) {
    d.reject(lat1, lon1, lat2, lon2);
    
  }
  else {
    d.resolve(lat1, lon1, lat2, lon2);
  }
  return d;
}

//onError Callback receives a PositionError object
function onError(error) {
  
  var gpsoff = "The last location provider was disabled";
  if(error.message == gpsoff) {
    alert("Please Check That GPS Switched is On");
    
    $("#stop").hide();
    $("#start").show();
    
    gps = false;
    clearWatch();
    $("#stat").empty().html("StandBy");
    
  }
  else if(error.code == error.PERMISSION_DENIED && track != false) {
    lineid = lineid + 1;
    window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, createLine, failLineCreate);
    
  }
}

//clear the watch that was started earlier
function clearWatch() {
  
  if(watchID != null) {
    navigator.geolocation.clearWatch(watchID);
    watchID = null;
  }
}

function distance(lat1, lat2, lon1, lon2) {
  
  var dLat = toRad((lat2 - lat1));
  var dLon = toRad((lon2 - lon1));
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);
  
  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.sin(dLon / 2) * Math.sin(dLon / 2) *
  Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c * 1000;
  return d;
  
}

function toRad(x) {
  
  return x * Math.PI / 180;
}

function calcDist(lat1, lat2, lon1, lon2) {
  
  var lat1 = toRad(parseFloat(lat1, 10));
  var lat2 = toRad(lat2);
  var lon1 = toRad(parseFloat(lon1, 10));
  var lon2 = toRad(lon2);
  var y = Math.acos(Math.sin(lat1) * Math.sin(lat2) + Math.cos(lat1) * Math.cos(lat2) *
              Math.cos(lon2 - lon1)) *
              R;
  return y * 1000;
  
}

function saveCoords(la, lo, ti, id) {
  
  if(la != 0 && lo != 0 && la != "" && lo != "" && la != null && lo != null && la != undefined &&
              lo != undefined && ti != undefined)
  {
    db.transaction(function(transaction) {
      
      transaction.executeSql(
                  'INSERT INTO gable (lat, lon, tim, submit, lineId) VALUES (?, ?, ?, ?, ?);', [
                                                                                                la, lo, ti, 0, id ], function(transaction, result) {
                    
                  }, function(transaction, error) {
                    
                  });
    });
  }
}

function countDB() {
  
  var d = $.Deferred();
  var r = "";
  db.transaction(function(transaction) {
    
    transaction.executeSql('SELECT * FROM gable where submit = ?;', [ 0 ], function(transaction,
                result) {
      
      r = result.rows.length;
      if(r > 0) {
        $("#savedentries").html(r);
      }
      else {
        $("#savedentries").html("_");
      }
      d.resolve(r);
    }, function(transaction, error) {
      
      //alert("Database Error: " + error);
    });
  });
  return d;
}
function countUpload() {
  
  var r = "";
  db.transaction(function(transaction) {
    
    transaction.executeSql('SELECT * FROM gable where submit = ?;', [ 1 ], function(transaction,
                result) {
      
      r = result.rows.length;
      if(r > 0) {
        $("#entry").html(r);
      }
      else {
        $("#entry").html("_");
      }
    }, function(transaction, error) {
      
      //alert("Database Error: " + error);
    });
  });
}

function submitted() {
  var d = $.Deferred();
  var r = "";
  db.transaction(function(transaction) {
    
    transaction.executeSql('SELECT * FROM gable where submit = ?;', [ 1 ], function(transaction,
                result) {
      
      r = result.rows.length;
      if(r > 0) {
        d.resolve(r);
        //$("#entry").html(r);
      }
      else {
        d.reject(r);
        //$("#entry").html("_");
      }
    }, function(transaction, error) {
      
      //alert("Database Error: " + error);
    });
  });
 
  return d;
}

function unSubmitted() {
  var d = $.Deferred();
  var r = "";
  db.transaction(function(transaction) {
    
    transaction.executeSql('SELECT * FROM gable where submit = ?;', [ 0 ], function(transaction,
                result) {
      
      r = result.rows.length;
      if(r > 0) {
        d.resolve(r);
        $("#savedentries").html(r);
      }
      else {
        d.reject(r);
        //$("#savedentries").html("_");
      }
    }, function(transaction, error) {
      
      //alert("Database Error: " + error);
    });
  });
  
  return d;
}

function progressStatus(){
  var d = $.Deferred();
  
  submitted().then(function(x){
    //alert("after submitted Uploaded values are "+x);    
    
    unSubmitted().then(function(y){
     // alert("after unsubmitted Remaining values are "+y);
     report = (x/(x+y)) * 100;
     
     d.resolve(report,x);
    }).fail(function(g){
      //alert("after fail unsubmitted Remaining values are "+g);
      report = 100;
     
      d.resolve(report,x); 
    });
    
  }).fail(function(d){
    //alert("after fail submitted Uploaded values are "+d);
    report = 0;
    d.resolve(report,0);
  }); 
  
  return d;

}

function clearTable() {
  
  db.transaction(function(tx) {
    
    tx.executeSql("DELETE FROM gable WHERE submit=?;", [ 1 ], function(transaction, result) {
      
    }, function(transaction, error) {
      
      //alert("Database error Table not Cleared: " + error);
    });
  });
}

;(function( $, window, undefined ) {
  $.extend($.mobile, {
      showToast: function(message,delay,callback) {
          var oldMsg = $.mobile.loadingMessage;
          $.mobile.loadingMessage = message;
          $.mobile.showPageLoadingMsg("a",message,true);
          if(delay && delay >0)
          {
              setTimeout(function(){
                  $.mobile.hidePageLoadingMsg();
                  $.mobile.loadingMessage = oldMsg;
                  if(callback) callback();
              },delay);
          }
          
      }
  });
})( jQuery, this );

function checkDB() {
  
  var d = $.Deferred();
  var r = "";
  db.transaction(function(transaction) {
    
    transaction.executeSql('SELECT * FROM gable where submit = ? ;', [ 0 ], function(transaction,
                result) {
      
      r = result.rows.length;
      if(r > 0) {
        d.resolve(r);
      }
      else {
        d.reject(r);
      }
    }, function(transaction, error) {
      
      //alert("Database Error: " + error);
    });
  });
  return d;
}

function checkDBLines(id) {
  
  var d = $.Deferred();
  var r = "";
  
  db.transaction(function(transaction) {
    
    transaction.executeSql('select * from gable where submit=? and lineId=? order by tim, id;', [
                                                                                                 0, id ], function(transaction, result) {
      
      r = result.rows.length;
      if(r > 0) {
        d.resolve(r);
      }
      else {
        d.reject(r);
      }
      
    }, function(transaction, error) {
      
      //alert("Database Error: " + error);
    });
  });
  return d;
}

function checkMultiLines(id) {
  
  var d = $.Deferred();
  var r;
  
  db.transaction(function(transaction) {
    
    transaction.executeSql('select * from gable where submit=? and lineId=? order by tim, id;', [
                                                                                                 0, id ], function(transaction, result) {
      
      r = result.rows.length;
      if(r > 1) {
        d.resolve(r);
      }
      else if(r == 1) {
        d.reject(r);
      }
      else {
        d.reject(r);
      }
      
    }, function(transaction, error) {
      
      //alert("Database Error: " + error);
    });
  });
  return d;
}

function readDB(m, batch) {
  
  var d = $.Deferred();
  var allTags = "";
  // alert("Inside readDB. ");
  checkMultiLines(m).then(
              function(count) {
                
                rows = rows + count;
                // alert("Inside checkMult. rows"+rows);
                
                db.transaction(function(transaction) {
                  
                  transaction.executeSql(
                              'SELECT * FROM gable WHERE submit=? and lineId =? ORDER BY tim, id;',
                              [ 0, m ], function(transaction, result) {
                                
                                for( var i = 0; i < count; i++) {
                                  allTags = allTags + result.rows.item(i).lon + ' ' +
                                  result.rows.item(i).lat;
                                  if(i < (count) - 1) {
                                    allTags = allTags + ',';
                                  }
                                  
                                }
                                
                                markRecord(m);
                                allTags = "(" + allTags + ")";
                                
                                multiids[iDmarker] = m;
                                iDmarker = iDmarker + 1;
                                // alert("tags
                                // is.
                                // "+allTags);
                                d.resolve(allTags, m, rows);
                              }
                              
                              , function(transaction, error) {
                                
                              });
                });
                
              }).fail(function(p) {
                
                d.reject(m, p);
                // alert("line not found at lineid "+m);
                
                if(p == 1) {
                  // alert("point id found at id: "+m+" rows is "+p);
                  pointids[iDm] = m;
                  iDm = iDm + 1;
                }
                
              });
  
  return d;
}

function cleanArray(array) {
  
  var d = $.Deferred();
  for( var x = 0; x < array.length; x++) {
    if(array[x] == undefined) {
      removeByIndex(array, x);
      
    }
    
  }
  d.resolve();
  
  return d;
}

function readPoints(batch) {
  
  var d = $.Deferred();
  var allTags = "";
  var count;
  var pointRows = 0;
  var arraylen;
  
  cleanArray(pointids).then(function() {
    
    arraylen = pointids.length;
  });
  
  batch = parseInt(batch, 10);
  // alert("Inside read points");
  if(arraylen >= 1) {
    // alert("Arraylen is "+arraylen);
    db.transaction(function(transaction) {
      
      transaction.executeSql('SELECT * FROM gable WHERE submit=?;', [ 0 ], function(transaction,
                  result) {
        
        count = result.rows.length;
        // alert("count is "+count);
        for( var i = count - 1; i >= 0; i--) {
          
          if(pointRows < 100) {
            
            for( var k = 0; k < arraylen; k++) {
              if(pointids[k] == result.rows.item(i).lineId) {
                // alert("Point array id is equal to db id:
                // "+pointids[k]+" =
                // "+result.rows.item(i).lineId);
                
                rPoint[k] = pointids[k];
                
                allTags = allTags + result.rows.item(i).lon + ' ' + result.rows.item(i).lat;
                
                if(pointRows < (arraylen) - 1) {
                  allTags = allTags + ',';
                }
                pointRows = pointRows + 1;
                mRecord(pointids[k]);
                break;
              }
            }
            
          }
          else {
            break;
          }
          
        }
        
        allTags = "(" + allTags + ")";
        // alert("Points are "+allTags);
        d.resolve(allTags, count, pointRows);
        
      }, function(transaction, error) {
        
      });
    });
    
  }
  else {
    d.reject(arraylen, "No Points Found");
    // alert("Inside read points. no points found");
  }
  
  return d;
}

function createTags(batch) {
  
  var d = $.Deferred();
  // alert("Inside createTags. ");
  if(mLine == true) {
    
    readDB(tempId, batch).then(function(tags, id, rowNumb) {
      
      d.resolve(tags, id, rowNumb);
      
    }).fail(function(id, x) {
      
      d.reject(id, x);
      
    });
    
  }
  else if(mPoint == true) {
    
    readPoints(batch).then(function(tags, count, rowNumb) {
      
      d.resolve(tags, count, rowNumb);
      
    }).fail(function(arrlen, msg) {
      
      d.reject(arrlen, msg);
      
    });
  }
  return d;
}

//Update record on the fly
function updateRecord(id) {
  
  db.transaction(function(tx) {
    
    tx.executeSql("UPDATE gable SET submit = ? WHERE lineId = ?", [ 1, id ], null, onDBError);
  });
}

function markRecord(id) {
  
  db.transaction(function(tx) {
    
    tx.executeSql("UPDATE gable SET submit = ? WHERE lineId = ?", [ 2, id ], null, onDBError);
  });
}

function mRecord(id) {
  
  db.transaction(function(tx) {
    
    tx.executeSql("UPDATE gable SET submit = ? WHERE lineId = ?", [ 3, id ], null, onDBError);
  });
}

function removeByIndex(arr, index) {
  
  arr.splice(index, 1);
}

function errorHandler(transaction, error) {
  
 // alert('Database Error was ' + error.message);
}
function onDBError(transaction, error) {
  
  //alert('Database Error was ' + error.message);
}
function loginStatus() {
  
  var d = $.Deferred();
  $.ajax({
    url : "http://api.geobucket.org/?q=bucket/system/connect.json", type : 'post',
    dataType : 'json', error : function(XMLHttpRequest, textStatus, errorThrown) {
      
      alert('Cannot Connect to GeoBucket Site. Check your internet connection is working');
      $.unblockUI();
    }, success : function(data) {
      
      var drupal_user = data.user;
      if(drupal_user.uid == 0) {
        // user is not logged in
        d.reject();
      }
      else { // user is logged in
        d.resolve();
        
      }
    }
  });
  return d;
}

function login(name, pass) {
  
  var d = $.Deferred();
  $.ajax({
    url : "http://api.geobucket.org/?q=bucket/user/login.json", type : 'post',
    data : 'username=' + encodeURIComponent(name) + '&password=' + encodeURIComponent(pass),
    dataType : 'json', error : function(XMLHttpRequest, textStatus, errorThrown) {
      
      d.reject("Failed to login: " + errorThrown);
    }, success : function(data) {
      
      d.resolve("Login Success");
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, deleteAnony, failDeleteAnony);
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, savePasswords, failsavePass);
      $.mobile.changePage("#page_home", "slide", true, false);
    }
  });
  return d;
}
function logout() {
  
  $.ajax({
    url : "http://api.geobucket.org/?q=bucket/user/logout.json", type : 'post', dataType : 'json',
    error : function(XMLHttpRequest, textStatus, errorThrown) {
      
     // alert('Failed to logout ' + errorThrown);
    }, success : function(data) {
      
      localStorage.usr = "0";
      localStorage.psw = "0";
      window.requestFileSystem(LocalFileSystem.PERSISTENT, 0, clearPasswords, failclearPass);
      alert("Logged out.");
    }
  });
}

function readPass(fileSystem) {
  
  fileSystem.root.getFile("passwords.txt", null, readPassFileEntry, failreadPass);
}
function readPassFileEntry(fileEntry) {
  
  fileEntry.file(readPassFile, failreadPass);
}
function readPassFile(file) {
  
  readPassAsText(file);
}
function readPassAsText(file) {
  
  var reader = new FileReader();
  reader.onload = function(evt) {
    
    var text = evt.target.result;
    var words = text.split(',');
    localStorage.usr = words[0];
    localStorage.psw = words[1];
    // alert("Read Pass and user: " + words[0] + "
    // and " +
    // words[1]);
  };
  reader.readAsText(file);
}
function failreadPass(evt) {
  
  // alert("User and Pass Not read");
}
function savePasswords(fileSystem) {
  
  fileSystem.root.getFile("passwords.txt", {
    create : true, exclusive : false
  }, savePassFileEntry, failsavePass);
}
function savePassFileEntry(fileEntry) {
  
  fileEntry.createWriter(savePassFileWriter, failsavePass);
}
function savePassFileWriter(writer) {
  
  writer.onwriteend = function(evt) {
    
    localStorage.usr = $("#username").val();
    localStorage.psw = $("#pass").val();
  };
  var auth = $("#username").val() + "," + $("#pass").val();
  writer.write(auth);
}
function failsavePass(error) {
  
  // alert("User and Pass Not Saved");
  $.unblockUI();
}
function clearPasswords(fileSystem) {
  
  fileSystem.root.getFile("passwords.txt", {
    create : true, exclusive : false
  }, clearPassFileEntry, failclearPass);
}
function clearPassFileEntry(fileEntry) {
  
  fileEntry.createWriter(clearPassFileWriter, failclearPass);
}
function clearPassFileWriter(writer) {
  
  writer.onwriteend = function(evt) {
    
  };
  var auth = 0 + "," + 0;
  writer.write(auth);
}
function failclearPass(error) {
  
  // alert("Error Logging Out, Try again");
  // $.unblockUI();
}
function createAnonymous(fileSystem) {
  
  fileSystem.root.getFile("anonymous.txt", {
    create : true, exclusive : false
  }, anonymousFileEntry, failanonymousCreate);
}
function anonymousFileEntry(fileEntry) {
  
  fileEntry.createWriter(anonymousFileWriter, failanonymousCreate);
}
function anonymousFileWriter(writer) {
  
  writer.onwriteend = function(evt) {
    
    localStorage.anonymous = "anonymous";
  };
  var auth = "anonymous";
  writer.write(auth);
}
function failanonymousCreate(error) {
  
  // alert("User and Pass Not Saved");
  $.unblockUI();
}
function readAnonymous(fileSystem) {
  
  fileSystem.root.getFile("anonymous.txt", null, gotAnonymous, failAnonymousread);
}
function gotAnonymous(fileEntry) {
  
  fileEntry.file(gotAnonymousFile, failAnonymousread);
}
function gotAnonymousFile(file) {
  
  readAnonymousText(file);
}
function readAnonymousText(file) {
  
  var reader = new FileReader();
  reader.onload = function(evt) {
    
    // alert("read annonymous: " +
    // evt.target.result);
    localStorage.anonymous = evt.target.result;
  };
  reader.readAsText(file);
}
function failAnonymousread(evt) {
  
  // alert("User and Pass Not read");
}
function deleteAnony(fileSystem) {
  
  fileSystem.root.getFile("anonymous.txt", {
    create : true, exclusive : false
  }, gotDeleteFileEntry, failDeleteAnony);
}
function gotDeleteFileEntry(fileEntry) {
  
  fileEntry.createWriter(gotDeleteFileWrite, failDeleteAnony);
}
function gotDeleteFileWrite(writer) {
  
  writer.onwriteend = function(evt) {
    
    localStorage.anonymous = "0";
  };
  var auth = "0";
  writer.write(auth);
}
function failDeleteAnony(error) {
  
  // alert("User and Pass Not Saved");
  $.unblockUI();
}

function readSettings(fileSystem) {
  
  fileSystem.root.getFile("settings.txt", null, readSettingsFileEntry, failSettings);
}
function readSettingsFileEntry(fileEntry) {
  
  fileEntry.file(readSettingsFile, failSettings);
}
function readSettingsFile(file) {
  
  readAsText(file);
}
function readAsText(file) {
  
  var reader = new FileReader();
  reader.onload = function(evt) {
    
    var text = evt.target.result;
    var words = text.split(',');
    localStorage.accuracy = words[0];
    localStorage.batch = words[1]
    // alert("Read accuracy and batch size: " +
    // words[0] + " and
    // " +
    // words[1]);
  };
  reader.readAsText(file);
}
function failSettings(evt) {
  
  //alert("Settings Not Read");
}

function saveSettings(fileSystem) {
  
  fileSystem.root.getFile("settings.txt", {
    create : true, exclusive : false
  }, saveSettingsFileEntry, failsaveSettings);
}
function saveSettingsFileEntry(fileEntry) {
  
  fileEntry.createWriter(saveSettingsFileWriter, failsaveSettings);
}
function saveSettingsFileWriter(writer) {
  
  writer.onwriteend = function(evt) {
    
    localStorage.accuracy = $("#accuracy").val();
    localStorage.batch = $("#batch").val();
  };
  var auth = $("#accuracy").val() + "," + $("#batch").val();
  //var auth = $("#batch").val();
  //alert("Just wrote; "+auth);
  writer.write(auth);
}
function failsaveSettings(error) {
  
  //alert("Batch Size Not Saved");
  $.unblockUI();
}

function createLine(fileSystem) {
  
  fileSystem.root.getFile("lineid.txt", {
    create : true, exclusive : false
  }, lineFileEntry, failLineCreate);
}
function lineFileEntry(fileEntry) {
  
  fileEntry.createWriter(lineFileWriter, failLineCreate);
}
function lineFileWriter(writer) {
  
  writer.onwriteend = function(evt) {
    
    localStorage.line = lineid;
    //  alert("Saved line id: "+lineid);
  };
  var auth = lineid;
  writer.write(auth);
}
function failLineCreate(error) {
  
  //alert("Line Id Not saved");
  $.unblockUI();
}
function readLine(fileSystem) {
  
  fileSystem.root.getFile("lineid.txt", null, gotLine, failLineread);
}
function gotLine(fileEntry) {
  
  fileEntry.file(gotLineFile, failLineread);
}
function gotLineFile(file) {
  
  readLineText(file);
}
function readLineText(file) {
  
  var reader = new FileReader();
  reader.onload = function(evt) {
    
    localStorage.line = evt.target.result;
    //  alert("read line: "+localStorage.line);
  };
  reader.readAsText(file);
}
function failLineread(evt) {
  
  //alert("Line Id not read");
}
