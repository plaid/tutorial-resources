//
//  PlaidLinkViewController.swift
//  SamplePlaidClients
//
//  Created by Todd Kerpelman on 8/18/23.
//

import UIKit

class PlaidLinkViewController: UIViewController {
    @IBOutlet var startLinkButton: UIButton!
    let communicator = ServerCommunicator()
    var linkToken: String?
//    var handler: Handler?
    
    
    private func createLinkConfiguration(linkToken: String) -> Any? {
        // Create our link configuration object
        // This return type will be a LinkTokenConfiguration object
        return nil
    }
    
    @IBAction func startLinkWasPressed(_ sender: Any) {
        // Handle the button being clicked
        
    }
    
    private func exchangePublicTokenForAccessToken(_ publicToken: String) {
        // Exchange our public token for an access token
    }
    
    
    private func fetchLinkToken() {
        // Fetch a link token from our server

    }
    
    override func viewDidLoad() {
        super.viewDidLoad()
        self.startLinkButton.isEnabled = false
        fetchLinkToken()
    }
    

    /*
    // MARK: - Navigation

    // In a storyboard-based application, you will often want to do a little preparation before navigation
    override func prepare(for segue: UIStoryboardSegue, sender: Any?) {
        // Get the new view controller using segue.destination.
        // Pass the selected object to the new view controller.
    }
    */

}
