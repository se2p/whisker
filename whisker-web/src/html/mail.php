<?php
if(isset($_POST["submit"])){
// Checking For blank fields..
    if($_POST["email"]==""||$_POST["age"]==""||$_POST["gender"]==""||$_POST["subject"]==""||$_POST["msg"]==""){
        echo "Fill All Fields..";
    }else{
// Check if the "Sender's Email" input field is filled out
        $email=$_POST['email'];
// Sanitize email address
        $email =filter_var($email, FILTER_SANITIZE_EMAIL);
// Validate email address
        $email= filter_var($email, FILTER_VALIDATE_EMAIL);
        if (!$email){
            echo "Invalid Sender's Email";
        }
        else{
            $subject = $_POST['subject'];
            $message = $_POST['msg'];
            $headers = 'From:'. $email . "rn"; // Sender's email
            $headers .= 'Cc:'. $email . "rn"; // Carbon copy to sender
// Message lines should not exceed 70 characters (PHP rule), so wrap it
            $message = wordwrap($message, 70);
// Send mail by PHP Mail Function (only works on Webserver, not on localhost!)
            mail("info@whisker.fim.uni-passau.de", $subject, $message, $headers);
            echo "Your mail has been sent successfully! Thank you for your feedback.";
        }
    }
}

