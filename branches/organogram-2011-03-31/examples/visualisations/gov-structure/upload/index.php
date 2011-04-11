<?php

//error_reporting(E_ALL);
//ini_set('display_errors', true);
//phpinfo();

require_once 'Excel/reader.php';
include 'functions.php';

$xlwrapMappingsDir = 'C:/xlwrap/mappings';

$action = '';
$email = '';
$dept = '';
$date = '';
$isoDate = '';
$filename = '';
$filenameNoExt = '';
$redirect = false;
$validEmail = false;
$validDate = false;
$validFile = false;
$validFilename = false;
$success = false;
$errors = array();

if (isset($_POST['email']) || isset($_GET['email'])) {
  $validEmail = true;
  if (isset($_POST['email'])) {
    $action = 'upload';
    $email = $_POST['email'];
  } else {
    $action = 'download';
    $email = $_GET['email'];
  }
  if (validEmail($email)) {
    $dept = departmentFromEmail($email);
  } else {
    $validEmail = false;
    $errors[] = 'That doesn\'t look like a valid email address.';
  }
}

if (isset($_POST['date']) || isset($_GET['date'])) {
  $validDate = true;
  if (isset($_POST['date'])) {
    $date = $_POST['date'];
  } else {
    $date = $_GET['date'];
  }
  $parts = explode('/', $date);
  $isoDate = "{$parts[2]}-{$parts[1]}-{$parts[0]}";
  $isoDate = isoFormatDate($date);
  if (!checkdate($parts[1],$parts[0],$parts[2])) {
    $validDate = false;
    $errors[] = 'That doesn\'t look like a valid date; the required format is DD/MM/YYYY (eg 31/03/2011).';
  }
}

if (isset($_FILES['file'])) {
  $validFile = true;
  $validFilename = true;
  $file = $_FILES['file'];
  $filename = str_replace(' ', '-', $file['name']);
  $filetype = $file['type'];
  $ext = substr($filename, strrpos($filename, '.') + 1);
  $filenameNoExt = substr($filename, 0, strrpos($filename, '.'));
  $tempfile = $file['tmp_name'];
  $error = $file['error'];
  $filesize = $file['size'];
  if ($error) {
    $validFile = false;
    $errors[] = file_upload_error_message($error);
  } else if ($ext != "xls" /* || $filetype != "application/vnd.ms-excel" */) {
    $validFile = false;
    if ($ext != 'xls') {
      $validFilename = false;
    }
    $errors[] = 'That doesn\'t look like a valid Excel spreadsheet.';
  }
} else if (isset($_GET['filename'])) {
  $validFilename = true;
  $filename = str_replace(' ', '-', $_GET['filename']);
  $ext = substr($filename, strrpos($filename, '.') + 1);
  $filenameNoExt = substr($filename, 0, strrpos($filename, '.'));
  if ($ext != 'xls') {
    $validFilename = false;
    $errors[] = 'That doesn\'t look like a valid filename for an Excel spreadsheet.';
  } else {
    $localCopy = "data/$dept/$isoDate/$filename";
    if (!file_exists($localCopy)) {
      $validFilename = false;
      $errors[] = 'There is no record of that spreadsheet.';
    }
  }
}

if (isset($_GET['redirect']) && $_GET['redirect'] == 'true') {
  $redirect = true;
}

if ($action == 'upload' && $validFile && $validEmail && $validDate) {
  $fileLocation = "data/$dept/$isoDate/$filename";
  $make = make_dir_for_file($fileLocation);
  if (!$make) {
    $success = false;
    $errors[] = 'Unable to create directory for spreadsheet.';
  } else if (move_uploaded_file($_FILES['file']['tmp_name'], $fileLocation)) {
    // write the trig file
    writeTransformation($dept, $isoDate, $filename, $xlwrapMappingsDir);
    // create senior posts CSV
    createSeniorCSV($fileLocation);        
    // create junior posts CSV
    createJuniorCSV($fileLocation);
    $success = true;
    
    // remove existing RDF version
    $rdfDumpLocation = "data/$dept/$isoDate/$filenameNoExt.rdf";
    if (file_exists($rdfDumpLocation)) {
      unlink($rdfDumpLocation);
    }
    // refresh XLWrap
    /*
    $query = array(
      'reload' => "file:$xlwrapMappingsDir/$dept-$isoDate-$filenameNoExt.trig"
    );
    $queryString = http_build_query($query);
    $params = array(
      'http' => array(
        'method' => 'GET',
        'header' => "Host: " . $_SERVER["HTTP_HOST"],
        'max_redirects' => 1,
        'ignore_errors' => true
      )
    );
    $ctx = stream_context_create($params);
    $url = 'http://localhost:8900/status/sparql';
    try {
      $fp = fopen($url . '?' . $queryString, 'rb', false, $ctx);
      if (!$fp) {
        $success = false;
        $errors[] = 'Error accessing XLWrap';
      } else {
        $response = stream_get_contents($fp);
        if ($response === false) {
          $success = false;
          $errors[] = 'Error getting response from XLWrap.';
        }
      }
    } catch (Exception $e) {
      $success = false;
      $errors[] = 'Error getting data from XLWrap.';
    }
    */
  } else {
    $success = false;
    $errors[] = 'Unable to save spreadsheet.';
  }
} else if ($action == 'download' && $validEmail && $validDate && $validFilename) {
  $success = createRDF($dept, $isoDate, $filenameNoExt);
  if (!$success) {
    $errors[] = 'Unable to generate RDF.';
  } else if ($redirect) {
    header($_SERVER["SERVER_PROTOCOL"] . " 307 Temporary Redirect");
    header("Location: /data/$dept/$isoDate/$filenameNoExt.rdf");
    echo "<html><head><title>Redirecting to RDF Data</title></head><body><p>You are being redirected to the RDF data.</p></body></html>";
    return;
  }
}

?>
<html xmlns="http://www.w3.org/1999/xhtml" xml:lang="en" lang="en" dir="ltr">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <title>Organogram Data Upload | data.gov.uk</title>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <link type="text/css" href="../css/upload.css" rel="stylesheet" />
    <script language="javascript" type="text/javascript" src="../scripts/jquery-1.4.4.min.js"></script>
    <script language="javascript" type="text/javascript" src="../scripts/upload.js"></script>
  </head>
  <!--[if IE 7]> 
  <body class="IE7 dps"> 
  <![endif]--> 
  <!--[if IE 8]> 
  <body class="IE8 dps"> 
  <![endif]--> 
  <body class="dps">
    <div id="page">
      <div role="banner" id="header">
        <div id="login">
          <img class="sprite" id="logo_hm-government" alt="HM Government logo" src="../images/1x1.gif" />
        </div>
        <div class="inner">
          <a title="Back to homepage" accesskey="1" class="sprite" id="logo_datagovuk" href="/"><span>Back to homepage</span></a>
          <span class="sprite" id="slogan"><span>Opening up government data</span></span>
        </div>
      </div> <!-- /#header-inner, /#header -->
      <div id="main">
        <div role="main" id="content">
          <div class="steps">
            <a class="step1 <?php if ($action == '' || ($action == 'upload' && (!$success || !$validEmail || !$validDate || !$validFilename))) { echo 'current'; } ?>" href="#upload">
              <span class="image"><img src="../images/upload_file.png" width="60" height="60" /></span>
              <span class="text"><span>Upload your spreadsheet</span></span>
            </a>
            <a class="step2 <?php if (!$validEmail || !$validDate || !$validFilename) { echo 'disabled'; } else if ($action == 'upload') { echo 'current'; } ?>" href="#preview">
              <span class="image"><img src="../images/preview.png" width="60" height="60"  /></span>
              <span class="text"><span>Preview organogram</span></span>       
            </a>
            <a class="step3 <?php if ($action == 'download') { echo 'current'; } ?>" href="#download">
              <span class="image"><img src="../images/download_data.png" width="60" height="60"  /></span>
              <span class="text"><span>Download data</span></span>       
            </a>
            <div class="clear"><!-- --></div>
          </div> <!-- /.steps -->
          <div id="content-area">
            <?php if (count($errors) > 0) { ?>
              <div id="errors">
                <p><?php echo join(' ', $errors); ?></p>
              </div>
            <?php } ?>
            <div class="node-inner">
              <div class="content">
                <div id="upload" class="upload panel">
                    <form id="upload_spreadsheet" enctype="multipart/form-data" action="/" method="post">
                      <fieldset>
                        <label for="upload-email">Your email address</label>
                        <input id="upload-email" name="email" type="text" value="<?php echo $email; ?>" <?php if ($action != '' && !$validEmail) { echo 'class="error"'; } ?> />
                        <label for="upload-file">Select spreadsheet file to upload</label>
                        <input id="upload-file" name="file" type="file" <?php if ($action != '' && !$validFile) { echo 'class="error"'; } ?> />
                        <label for="upload-date">Snapshot date (dd/mm/yyyy)</label>
                        <input id="upload-date" type="text" name="date" maxlength="10" value="<?php if ($date == '') { echo '31/03/2011'; } else { echo $date; } ?>" <?php if ($action != '' && !$validDate) { echo 'class="error"'; } ?> />
                        <input type="submit" value="Upload" title="The organogram spreadsheets are large and can take some time to upload. Please be patient." />
                      </fieldset>
                    </form>
                    <div class="uploading links">
                      <img src="../images/uploading.gif" />
                      <p style="font-weight:bold;">Uploading...</p>
                      <p>The organogram spreadsheets are large and take time to upload.</p>
                      <p>Please be patient.</p>
                    </div>
                </div> <!-- end upload panel -->
                <div id="preview" class="preview panel">
                  <div class="links">
                    <?php if ($success) { ?>
                      <?php
                        $components = organogramUrl($dept, $isoDate, $filenameNoExt);
                        $deptOrPubBod = $components['deptOrPubBod'];
                        $deptOrPubBodId = $components['deptOrPubBodId'];
                        $postId = $components['postId'];
                      ?>
                      <p>You can now preview the organogram generated from the spreadsheet that you have provided.</p>
                      <p>Posts by type:</p>
                      <ul class="post_list">
                        <li><a href="http://labs.data.gov.uk/gov-structure/post-list/?<?php echo $deptOrPubBod; ?>=<?php echo $deptOrPubBodId; ?>&grade=SCS4&preview=true" target="_blank">SCS4 (Permanent Secretaries)</a></li>
                        <li><a href="http://labs.data.gov.uk/gov-structure/post-list/?<?php echo $deptOrPubBod; ?>=<?php echo $deptOrPubBodId; ?>&grade=SCS3&preview=true" target="_blank">SCS3 (Director Generals)</a></li>
                        <li><a href="http://labs.data.gov.uk/gov-structure/post-list/?<?php echo $deptOrPubBod; ?>=<?php echo $deptOrPubBodId; ?>&grade=SCS&preview=true2" target="_blank">SCS2 (Directors)</a></li>
                        <li><a href="http://labs.data.gov.uk/gov-structure/post-list/?<?php echo $deptOrPubBod; ?>=<?php echo $deptOrPubBodId; ?>&grade=SCS1A&preview=true" target="_blank">SCS1A (Deputy Directors)</a></li>
                        <li><a href="http://labs.data.gov.uk/gov-structure/post-list/?<?php echo $deptOrPubBod; ?>=<?php echo $deptOrPubBodId; ?>&grade=SCS1&preview=true" target="_blank">SCS1 (Deputy Directors)</a></li>
                      </ul>
                      <p>Example organogram:</p>
                      <ul class="organogram">
                        <li><a href="http://labs.data.gov.uk/gov-structure/organogram/?<?php echo $deptOrPubBod; ?>=<?php echo $deptOrPubBodId; ?>&post=<?php echo $postId ?>&preview=true">Top Post</a></li>
                      </ul>
                    <?php } else { ?>
                      <p>You cannot preview an organogram until you upload a spreadsheet.</p>
                    <?php } ?>
                  </div>
                </div> <!-- end preview panel -->
                <div id="download" class="download panel">
                  <?php if (!$validEmail || !$validDate || !$validFilename) { ?>
                    <form id="download_data" method="get" action="/">
                      <fieldset>
                        <label for="download-email">Your email address</label>
                        <input id="download-email" name="email" type="text" value="<?php echo $email; ?>" <?php if ($action != '' && !$validEmail) { echo 'class="error"'; } ?> />
                        <label for="download-filename">Filename of spreadsheet file</label>
                        <input id="download-filename" name="filename" type="text" value="<?php echo $filename; ?>" <?php if ($action != '' && !$validFilename) { echo 'class="error"'; } ?> />
                        <label for="download-date">Snapshot date (dd/mm/yyyy)</label>
                        <input id="download-date" type="text" name="date" maxlength="10" value="<?php if ($date == '') { echo '31/03/2011'; } else { echo $date; } ?>" <?php if ($action != '' && !$validDate) { echo 'class="error"'; } ?> />
                        <input type="submit" value="Download" title="It can take some time to generate the RDF. Please be patient." />
                      </fieldset>
                    </form>
                  <?php } else { ?>
                    <?php 
                      $directory = "/data/$dept/$isoDate";
                      if ($action == 'download') {
                        $rdfUri = "$directory/$filenameNoExt.rdf";
                      } else {
                        $rdfUri = "/?email=$email&date=$date&filename=$filename&redirect=true";
                      }
                      $seniorCSVUri = "$directory/$filenameNoExt-senior-data.csv";
                      $juniorCSVUri = "$directory/$filenameNoExt-junior-data.csv";
                    ?>
                    <div class="links">
                      <p>You can now download your data through the following links.<?php if ($action != 'download') { echo ' Note that it can take some time for the RDF to be generated. Please be patient.'; } ?></p>
                      <ul>
                        <li><a class="rdf <?php if ($action != 'download') { echo 'generating'; } ?>" href="<?php echo $rdfUri ?>">Download RDF</a></li>
                        <li><a class="csv" href="<?php echo $seniorCSVUri ?>">Download Senior Post CSV</a></li>
                        <li><a class="csv" href="<?php echo $juniorCSVUri ?>">Download Junior Post CSV</a></li>
                      </ul>
                    </div>
                  <?php } ?>
                  <div class="downloading links">
                    <img src="../images/uploading.gif" />
                    <p style="font-weight:bold;">Downloading...</p>
                    <p>The organogram RDF is large and takes time to be generated.</p>
                    <p>Please be patient.</p>
                  </div>
                </div> <!-- end download panel -->
              </div>
            </div> <!-- /node-inner, /node -->
          </div>
        </div> <!-- /#content -->
      </div> <!-- /#main -->
    </div>
  </body>
</html>