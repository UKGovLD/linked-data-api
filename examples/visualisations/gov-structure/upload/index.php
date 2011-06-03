<?php

//error_reporting(E_ALL);
//ini_set('display_errors', true);
//phpinfo();

require_once 'Excel/reader.php';
include 'functions.php';

#$xlwrapMappingsDir = 'C:/xlwrap/mappings';
$xlwrapMappingsDir = 'xlwrap/mappings';

$adminEmails = array(
  'jeni@jenitennison.com',
  'john.sheridan@nationalarchives.gsi.gov.uk',
  'clemence.cleave-doyard@nationalarchives.gsi.gov.uk',
  'simon.demissie@nationalarchives.gsi.gov.uk'
);

$action = '';
$email = '';
$dept = '';
$date = '';
$isoDate = '';
$dir = '';
$filename = '';
$filenameNoExt = '';
$fileLocation = '';
$isAdmin = false;
$redirect = false;
$validEmail = false;
$validDate = false;
$validFile = false;
$validFilename = false;
$files = array();
$success = false;
$errors = array();

if (isset($_POST['action'])) {
  $action = strtolower($_POST['action']);
} else if (isset($_GET['action'])) {
  $action = strtolower($_GET['action']);
}

if (isset($_POST['email']) || isset($_GET['email'])) {
  $validEmail = true;
  if (isset($_POST['email'])) {
    $email = $_POST['email'];
  } else {
    $email = $_GET['email'];
  }
  if (validEmail($email)) {
    $dept = departmentFromEmail($email);
  } else {
    $validEmail = false;
    $errors[] = 'That doesn\'t look like a valid email address.';
  }
}

if (isset($_POST['admin']) || isset($_GET['admin'])) {
  $isAdmin = true;
} else if (in_array(strtolower($email), $adminEmails)) {
  $isAdmin = true;
}

if (isset($_POST['date']) || isset($_GET['date'])) {
  $validDate = true;
  if (isset($_POST['date'])) {
    $date = $_POST['date'];
  } else {
    $date = $_GET['date'];
  }
  $parts = explode('/', $date);
  if (count($parts) == 3) {
    $isoDate = "{$parts[2]}-{$parts[1]}-{$parts[0]}";
    $isoDate = isoFormatDate($date);
    if (!checkdate($parts[1],$parts[0],$parts[2])) {
      $validDate = false;
      $errors[] = 'That doesn\'t look like a valid date; the required format is DD/MM/YYYY (eg 31/03/2011).';
    }
  } else {
    $validDate = false;
    $errors[] = 'That doesn\'t look like a valid date; the required format is DD/MM/YYYY (eg 31/03/2011).';
  }
}

if ($validEmail && $validDate) {
  $dir = "data/$dept/$isoDate";
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
  } else {
    $fileLocation = "$dir/$filename";
  }
} else if (isset($_POST['filename']) || isset($_GET['filename'])) {
  $validFilename = true;
  if (isset($_POST['filename'])) {
    $filename = str_replace(' ', '-', $_POST['filename']);
  } else {
    $filename = str_replace(' ', '-', $_GET['filename']);
  }
  $ext = substr($filename, strrpos($filename, '.') + 1);
  $filenameNoExt = substr($filename, 0, strrpos($filename, '.'));
  if ($filename == '') {
    $validFilename = false;
  } else if ($ext != 'xls') {
    $validFilename = false;
    $errors[] = 'That doesn\'t look like a valid filename for an Excel spreadsheet.';
  } else {
    $fileLocation = "$dir/$filename";
    if (!file_exists($fileLocation)) {
      $validFilename = false;
      $errors[] = 'There is no record of that spreadsheet.';
    }
  }
}

if (isset($_GET['redirect']) && $_GET['redirect'] == 'true') {
  $redirect = true;
}

if ($action == 'upload' && $validFile && $validEmail && $validDate) {
  $make = make_dir_for_file($fileLocation);
  if (!$make) {
    $success = false;
    $errors[] = 'Unable to create directory for spreadsheet.';
  } else if (move_uploaded_file($_FILES['file']['tmp_name'], $fileLocation)) {
    // create senior posts CSV
    $invalidSenior = createSeniorCSV($fileLocation);
    // create junior posts CSV
    $invalidJunior = createJuniorCSV($fileLocation);
    
    if ($invalidSenior || $invalidJunior) {
      $success = false;
      if ($invalidSenior) {
        $errors[] = $invalidSenior;
      }
      if ($invalidJunior) {
        $errors[] = $invalidJunior;
      }
      $errors[] = 'Please check your data and try again.';
    } else if (!filesize("$dir/$filenameNoExt-senior-data.csv") || !filesize("$dir/$filenameNoExt-junior-data.csv")) {
      $success = false;
      $errors[] = 'The Excel file you uploaded is invalid. Please ensure that it uses the template and has no invalid rows, and try again.';
    } else {
      // write the trig file
      writeTransformation($dept, $isoDate, $filename, $email, $xlwrapMappingsDir);

      // remove existing RDF version
      $rdfDumpLocation = "data/$dept/$isoDate/$filenameNoExt.rdf";
      if (file_exists($rdfDumpLocation)) {
        unlink($rdfDumpLocation);
      }
      
      // create the new RDF
      $success = createRDF($dept, $isoDate, $filenameNoExt);
      
      if (!$success || !filesize($rdfDumpLocation)) {
        $success = false;
      } else {
        // load the RDF into Sesame
        $success = loadRDF($rdfDumpLocation);
      }
      
      if (!$success) {
        $errors[] = 'Unable to create a preview of your data at the moment. Please check your spreadsheet and try again later.';
      }
      
      // remove the Trig from the mappings directory
      $mappingLocation = "$xlwrapMappingsDir/$dept-$isoDate-$filenameNoExt.trig";
      if (file_exists($mappingLocation)) {
        unlink($mappingLocation);
      }
    }
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
    header("Location: /$dir/$filenameNoExt.rdf");
    echo "<html><head><title>Redirecting to RDF Data</title></head><body><p>You are being redirected to the RDF data.</p></body></html>";
    return;
  }
}

if ((($action == 'upload' && !$success) || $action == 'delete-preview' || $action == 'delete-download') && $validEmail && $validDate && $validFilename) {
  $rdfFile = "$dir/$filenameNoExt.rdf";
  $seniorCSV = "$dir/$filenameNoExt-senior-data.csv";
  $juniorCSV = "$dir/$filenameNoExt-junior-data.csv";
  $localMapping = "$dir/$filenameNoExt-mapping.trig";
  $xlwrapMapping = "$xlwrapMappingsDir/$dept-$isoDate-$filenameNoExt.trig";
  if (file_exists($fileLocation)) {
    unlink($fileLocation);
  }
  if (file_exists($rdfFile)) {
    unlink($rdfFile);
  }
  if (file_exists($seniorCSV)) {
    unlink($seniorCSV);
  }
  if (file_exists($juniorCSV)) {
    unlink($juniorCSV);
  }
  /*
  if (file_exists($localMapping)) {
    unlink($localMapping);
  }
  */
  if (file_exists($xlwrapMapping)) {
    unlink($xlwrapMapping);
  }
  $deletedRDF = deleteRDF($rdfFile);
  $filename = '';
  $filenameNoExt = '';
  $validFilename = false;
  if ($action == 'delete-preview' || $action == 'delete-download') {
    $success = $deletedRDF;
  }
} else if (($action == 'disable-preview' || $action == 'disable-download') && $validEmail && $validDate && $validFilename) {
  $xlwrapMapping = "$xlwrapMappingsDir/$dept-$isoDate-$filenameNoExt.trig";
  if (file_exists($xlwrapMapping)) {
    unlink($xlwrapMapping);
  }
  $success = true;
} else if (($action == 'enable-preview' || $action == 'enable-download') && $validEmail && $validDate && $validFilename) {
  $localMapping = "$dir/$filenameNoExt-mapping.trig";
  $xlwrapMapping = "$xlwrapMappingsDir/$dept-$isoDate-$filenameNoExt.trig";
  if (file_exists($localMapping)) {
    copy($localMapping, $xlwrapMapping);
  }
  $success = true;
}

if ($isAdmin) {
  $dataDirResource = opendir('data');
  if ($dataDirResource) {
    while (false != ($deptName = readdir($dataDirResource))) {
      $deptDir = "data/$deptName";
      if (file_exists($deptDir) && filetype($deptDir) == 'dir') {
        $deptDirResource = opendir($deptDir);
        while (false != ($dated = readdir($deptDirResource))) {
          if (preg_match('/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/', $dated)) {
            $dateDir = "data/$deptName/$dated";
            if (file_exists($dateDir)) {
              $dateDirResource = opendir($dateDir);
              if ($dateDirResource) {
                while (false != ($excelFile = readdir($dateDirResource))) {
                  $ext = substr($excelFile, strrpos($excelFile, '.') + 1);
                  if ($ext == 'xls') {
                    $baseFilename = substr($excelFile, 0, strrpos($excelFile, '.'));
                    $mappingFilename = "$dateDir/$baseFilename-mapping.trig";
                    $mappingFileContents = file_get_contents($mappingFilename);
                    preg_match('/foaf:mbox \<mailto:([^>]+)\>/', $mappingFileContents, $matches);
                    $files[] = array(
                      'filename' => $excelFile,
                      'dept' => $deptName,
                      'isoDate' => $dated,
                      'date' => preg_replace('/([0-9]{4})-([0-9]{2})-([0-9]{2})/', '$3/$2/$1', $dated),
                      'modified' => filemtime("$dateDir/$excelFile"),
                      'submitter' => $matches[1],
                      'enabled' => file_exists("$xlwrapMappingsDir/$deptName-$dated-$baseFilename.trig")
                    );
                  }
                }
              }
            }
          }
        }
      }
    }
  } else {
    $success = false;
    $errors[] = 'Couldn\'t open the directory of data to list spreadsheets.';
  }
} else if (file_exists($dir)) {
  // populate $files
  $dirResource = opendir($dir);
  if ($dirResource) {
    while (false !== ($name = readdir($dirResource))) {
      $ext = substr($name, strrpos($name, '.') + 1);
      if ($ext == 'xls') {
        $baseFilename = substr($name, 0, strrpos($name, '.'));
        $files[] = array(
          'filename' => $name,
          'modified' => filemtime($dir . '/' . $name),
          'enabled' => file_exists("$xlwrapMappingsDir/$dept-$isoDate-$baseFilename.trig")
        );
      }
    }
  } else {
    $success = false;
    $errors[] = 'Couldn\'t open the directory of data to list spreadsheets.';
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
            <a class="step2 <?php if ($action == 'preview' || $action == 'delete-preview' || $action == 'enable-preview' || $action == 'disable-preview' || ($action == 'upload' && $success)) { echo 'current'; } ?>" href="#preview">
              <span class="image"><img src="../images/preview.png" width="60" height="60"  /></span>
              <span class="text"><span>Preview organogram</span></span>       
            </a>
            <a class="step3 <?php if ($action == 'download' || $action == 'delete-download' || $action == 'enable-download' || $action == 'disable-download') { echo 'current'; } ?>" href="#download">
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
            <?php } else if (($action == 'delete-download' || $action == 'delete-preview') && $success) { ?>
              <div id="errors">
                <p>Successfully deleted <?php echo $filename; ?></p>
              </div>
            <?php } ?>
            <!--
            <div id="errors">
              <p>$action: <?php echo $action; ?></p>
              <p>$email: <?php echo $email; ?></p>
              <p>$date: <?php echo $date; ?></p>
              <p>$filename: <?php echo $filename; ?></p>
            </div>
            -->
            <div class="node-inner">
              <div class="content <?php if ($isAdmin) { echo 'admin'; } ?>">
                <div id="upload" class="upload panel">
                    <form id="upload_spreadsheet" enctype="multipart/form-data" action="/" method="post">
                      <fieldset>
                        <label for="upload-email">Your email address</label>
                        <input id="upload-email" name="email" type="text" value="<?php echo $email; ?>" <?php if ($action != '' && !$validEmail) { echo 'class="error"'; } ?> />
                        <label for="upload-file">Select spreadsheet file to upload</label>
                        <input id="upload-file" name="file" type="file" <?php if ($action != '' && !$validFile) { echo 'class="error"'; } ?> />
                        <label for="upload-date">Snapshot date (dd/mm/yyyy)</label>
                        <input id="upload-date" type="text" name="date" maxlength="10" value="<?php if ($date == '') { echo '31/03/2011'; } else { echo $date; } ?>" <?php if ($action != '' && !$validDate) { echo 'class="error"'; } ?> />
                        <input name="action" type="submit" value="Upload" title="The organogram spreadsheets are large and can take some time to upload. Please be patient." />
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
                  <?php if ($validEmail && $validDate && $validFilename && $action != 'delete-preview' && $action != 'delete-download' && $action != 'enable-preview' && $action != 'enable-download' && $action != 'disable-preview' && $action != 'disable-download') { ?>
                    <?php
                      $orgInfo = organogramInfo($dept, $isoDate, $filenameNoExt);
                    ?>
                    <div class="links">
                      <p>You can now preview the organogram generated from the spreadsheet that you have provided or <a href="/?email=<?php echo $email; ?>&date=<?php echo $date; ?>&action=preview<?php if ($isAdmin) { echo '&admin=true'; } ?>">preview other spreadsheets</a>.</p>
                      <p>Posts by type:</p>
                      <ul class="post_list">
                        <?php foreach($orgInfo as $bodyUri => $body) { 
                          $bodyType = $body['type'];
                          $bodyId = $body['id'];
                          $bodyLabel = $body['label'];
                          $grades = $body['grades']; ?>
                          <li>
                            <?php echo $bodyLabel; ?>
                            <?php foreach ($grades as $grade => $present) { ?>
                              -
                              <a href="http://organogram.data.gov.uk/gov-structure/post-list?<?php echo $bodyType; ?>=<?php echo $bodyId; ?>&property=grade&value=<?php echo $grade; ?>&preview=true" target="_blank">
                                <?php echo "{$grade}s"; ?>
                              </a>
                            <?php } ?>
                          </li>
                        <?php } ?>
                      </ul>
                      <p>Example organograms:</p>
                      <ul class="organogram">
                        <?php foreach ($orgInfo as $bodyUri => $body) {
                          $bodyType = $body['type'];
                          $bodyId = $body['id'];
                          $bodyLabel = $body['label'];
                          $posts = $body['posts'];
                          if (count($posts) > 0) {
                            foreach ($posts as $post) {
                              $postId = $post['id'];
                              $postLabel = $post['label'];
                              echo "<li><a href=\"http://organogram.data.gov.uk/gov-structure/organogram/?$bodyType=$bodyId&post=$postId&preview=true\" target=\"_blank\">$postLabel</a></li>";
                            }
                          }
                        } ?>
                      </ul>
                      <p>Browse:</p>
                      <ul>
                        <?php foreach($orgInfo as $bodyUri => $body) { 
                          $bodyType = $body['type'];
                          $bodyId = $body['id'];
                          $bodyLabel = $body['label'];
                          $bodyApiUri = 'http://organogram.data.gov.uk/doc/'.($bodyType == 'pubbod' ? 'public-body' : 'department').'/'.$bodyId; ?>
                          <li>
                            <a href="<?php echo $bodyApiUri; ?>"><?php echo $bodyLabel; ?></a>
                            -
                            <a href="<?php echo $bodyApiUri; ?>/unit">Units</a>
                            -
                            <a href="<?php echo $bodyApiUri; ?>/post">Posts</a>
                          </li>
                        <?php } ?>
                        <?php foreach ($orgInfo as $bodyUri => $body) {
                          $bodyType = $body['type'] == 'pubbod' ? 'public-body' : 'department';
                          $bodyId = $body['id'];
                          $bodyLabel = $body['label'];
                          $posts = $body['posts'];
                          if (count($posts) > 0) {
                            foreach ($posts as $post) {
                              $postId = $post['id'];
                              $postLabel = $post['label'];
                              echo "<li><a href=\"http://organogram.data.gov.uk/doc/$bodyType/$bodyId/post/$postId\">$postLabel</a></li>";
                            }
                          }
                        } ?>
                      </ul>
                    </div>
                  <?php } else if (count($files) > 0) { ?>
                    <div class="links listing">
                      <p>Select a spreadsheet to preview.</p>
                      <table>
                        <?php foreach ($files as $i => $file) { ?>
                          <tr<?php if ($isAdmin && !$file['enabled']) { echo ' class="disabled"'; } ?>>
                            <?php if ($isAdmin) { ?>
                              <td class="submitter">
                                <?php if ($file['submitter']) { ?>
                                  <a href="mailto:<?php echo $file['submitter']; ?>?subject=Organogram">
                                    <?php echo $file['submitter']; ?>
                                  </a>
                                <?php } else { ?>
                                  <?php echo $file['dept']; ?>
                                <?php } ?>
                              </td>
                            <?php } ?>
                            <td class="filename">
                              <a href="<?php if ($isAdmin) { echo '/data/'.$file['dept'].'/'.$file['isoDate'].'/'.$file['filename']; } else { echo $dir.'/'.$file['filename']; } ?>">
                                <?php echo $file['filename']; ?>
                              </a>
                            </td>
                            <td class="modified"><?php echo date('d M Y H:i', $file['modified']); ?></td>
                            <td class="preview">
                              <form action="/" method="get">
                                <input name="email" type="hidden" value="<?php echo $isAdmin ? $file['submitter'] : $email; ?>" />
                                <?php if ($isAdmin) { ?>
                                  <input name="admin" type="hidden" value="true" />
                                <?php } ?>
                                <input name="date" type="hidden" value="<?php echo $isAdmin ? $file['date'] : $date; ?>" />
                                <input name="filename" type="hidden" value="<?php echo $file['filename']; ?>" />
                                <input name="action" type="submit" value="Preview" />
                              </form>
                            </td>
                            <td class="delete">
                              <form action="/" method="post">
                                <input name="email" type="hidden" value="<?php echo $isAdmin ? $file['submitter'] : $email; ?>" />
                                <?php if ($isAdmin) { ?>
                                  <input name="admin" type="hidden" value="true" />
                                <?php } ?>
                                <input name="date" type="hidden" value="<?php echo $isAdmin ? $file['date'] : $date; ?>" />
                                <input name="filename" type="hidden" value="<?php echo $file['filename']; ?>" />
                                <input name="action" type="hidden" value="delete-preview" />
                                <input type="submit" value="Delete" />
                              </form>
                            </td>
                          </tr>
                        <?php } ?>
                      </table>
                    </div>
                  <?php } else if ($validEmail && $validDate) { ?>
                    <div class="links">
                      <p>You do not currently have any spreadsheets to preview. Upload a new spreadsheet first.</p>
                    </div>
                  <?php } else { ?>
                    <form id="download_data" method="get" action="/">
                      <fieldset>
                        <label for="download-email">Your email address</label>
                        <input id="download-email" name="email" type="text" value="<?php echo $email; ?>" <?php if ($action != '' && !$validEmail) { echo 'class="error"'; } ?> />
                        <label for="download-filename">Spreadsheet filename (leave blank to list spreadsheets)</label>
                        <input id="download-filename" name="filename" type="text" value="<?php echo $filename; ?>" <?php if ($action != '' && !$validFilename) { echo 'class="error"'; } ?> />
                        <label for="download-date">Snapshot date (dd/mm/yyyy)</label>
                        <input id="download-date" type="text" name="date" maxlength="10" value="<?php if ($date == '') { echo '31/03/2011'; } else { echo $date; } ?>" <?php if ($action != '' && !$validDate) { echo 'class="error"'; } ?> />
                        <input name="action" type="submit" value="Preview" />
                      </fieldset>
                    </form>
                  <?php } ?>
                </div> <!-- end preview panel -->
                <div id="download" class="download panel">
                  <?php if ($validEmail && $validDate && $validFilename && $action != 'delete-preview' && $action != 'delete-download' && $action != 'enable-preview' && $action != 'enable-download' && $action != 'disable-preview' && $action != 'disable-download') { ?>
                    <?php 
                      if ($action == 'download') {
                        // in this case the data has been generated through the processing earlier in the PHP
                        $rdfUri = "$dir/$filenameNoExt.rdf";
                      } else {
                        // in this case, we've just uploaded a file and it still needs to be generated
                        $rdfUri = "/?email=$email&date=$date&filename=$filename&redirect=true&action=download";
                      }
                      $seniorCSVUri = "$dir/$filenameNoExt-senior-data.csv";
                      $juniorCSVUri = "$dir/$filenameNoExt-junior-data.csv";
                    ?>
                    <div class="links">
                      <p>You can now download your data through the following links or <a href="/?email=<?php echo $email; ?>&date=<?php echo $date; ?>&action=download<?php if ($isAdmin) { echo '&admin=true'; } ?>">download data from other spreadsheets</a>.<?php if ($action != 'download') { echo ' Note that it can take some time for the RDF to be generated. Please be patient.'; } ?></p>
                      <ul>
                        <li><a class="rdf <?php if ($action != 'download') { echo 'generating'; } ?>" href="<?php echo $rdfUri ?>">Download RDF</a></li>
                        <li><a class="csv" href="<?php echo $seniorCSVUri ?>">Download Senior Post CSV</a></li>
                        <li><a class="csv" href="<?php echo $juniorCSVUri ?>">Download Junior Post CSV</a></li>
                      </ul>
                    </div>
                  <?php } else if (count($files) > 0) { ?>
                    <div class="links listing">
                      <p>Select a spreadsheet whose data you want to download.</p>
                      <table>
                        <?php foreach ($files as $i => $file) { ?>
                          <tr<?php if ($isAdmin && !$file['enabled']) { echo ' class="disabled"'; } ?>>
                            <?php if ($isAdmin) { ?>
                              <td class="submitter">
                                <?php if ($file['submitter']) { ?>
                                  <a href="mailto:<?php echo $file['submitter']; ?>?subject=Organogram">
                                    <?php echo $file['submitter']; ?>
                                  </a>
                                <?php } else { ?>
                                  <?php echo $file['dept']; ?>
                                <?php } ?>
                              </td>
                            <?php } ?>
                            <td class="filename">
                              <a href="<?php if ($isAdmin) { echo '/data/'.$file['dept'].'/'.$isoDate.'/'.$file['filename']; } else { echo $dir.'/'.$file['filename']; } ?>">
                                <?php echo $file['filename']; ?>
                              </a>
                            </td>
                            <td class="modified"><?php echo date('d M Y H:i', $file['modified']); ?></td>
                            <td class="preview">
                              <form action="/" method="get">
                                <input name="email" type="hidden" value="<?php echo $isAdmin ? $file['submitter'] : $email; ?>" />
                                <?php if ($isAdmin) { ?>
                                  <input name="admin" type="hidden" value="true" />
                                <?php } ?>
                                <input name="date" type="hidden" value="<?php echo $date; ?>" />
                                <input name="filename" type="hidden" value="<?php echo $file['filename']; ?>" />
                                <input name="action" type="submit" value="Download" />
                              </form>
                            </td>
                            <td class="delete">
                              <form action="/" method="post">
                                <input name="email" type="hidden" value="<?php echo $isAdmin ? $file['submitter'] : $email; ?>" />
                                <?php if ($isAdmin) { ?>
                                  <input name="admin" type="hidden" value="true" />
                                <?php } ?>
                                <input name="date" type="hidden" value="<?php echo $date; ?>" />
                                <input name="filename" type="hidden" value="<?php echo $file['filename']; ?>" />
                                <input name="action" type="hidden" value="delete-download" />
                                <input type="submit" value="Delete" />
                              </form>
                            </td>
                          </tr>
                        <?php } ?>
                      </table>
                    </div>
                  <?php } else if ($validEmail && $validDate) { ?>
                    <div class="links">
                      <p>You do not currently have any spreadsheets to download. Upload a new spreadsheet first.</p>
                    </div>
                  <?php } else { ?>
                    <form id="download_data" method="get" action="/">
                      <fieldset>
                        <label for="download-email">Your email address</label>
                        <input id="download-email" name="email" type="text" value="<?php echo $email; ?>" <?php if ($action != '' && !$validEmail) { echo 'class="error"'; } ?> />
                        <label for="download-filename">Spreadsheet filename (leave blank to list spreadsheets)</label>
                        <input id="download-filename" name="filename" type="text" value="<?php echo $filename; ?>" <?php if ($action != '' && !$validFilename) { echo 'class="error"'; } ?> />
                        <label for="download-date">Snapshot date (dd/mm/yyyy)</label>
                        <input id="download-date" type="text" name="date" maxlength="10" value="<?php if ($date == '') { echo '31/03/2011'; } else { echo $date; } ?>" <?php if ($action != '' && !$validDate) { echo 'class="error"'; } ?> />
                        <input name="action" type="submit" value="Download" title="It can take some time to generate the RDF. Please be patient." />
                      </fieldset>
                    </form>
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