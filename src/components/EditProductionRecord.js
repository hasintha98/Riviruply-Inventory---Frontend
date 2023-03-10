import { CAlert, CButton, CCol, CFormInput, CFormLabel, CModal, CModalBody, CRow } from '@coreui/react'
import moment from 'moment'
import React, { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { PAGES, ACTIONS } from 'src/hooks/constants'
import ActivityLogsService from 'src/services/ActivityLogsService'
import AuthService from 'src/services/AuthService'
import PermissionsService from 'src/services/PermissionsService'
import ProductionService from 'src/services/ProductionService'
import swal from 'sweetalert'

const EditProductionRecord = () => {
    const [visible, setVisible] = useState(false)
    const [alert, setAlert] = useState(false)
    const [isFocus, setIsFocus] = useState(false)
    const [inputValue, setInputValue] = useState("")
    const [isHovered, setIsHovered] = useState(false)
    const inputRef = useRef()
    const [successRecordId, setSuccessRecordId] = useState(null)
    const [date, setDate] = useState(null)
    const [size, setSize] = useState(null)
    const [type, setType] = useState("")
    const [qty, setQty] = useState(null)
    const [id, setId] = useState("")
    const [pin, setPin] = useState("")
    const search = useLocation().search

    useEffect(() => {
        setId(new URLSearchParams(search).get('pin'))
        setInputValue(new URLSearchParams(search).get('type'))
        setDate(new URLSearchParams(search).get('date'))
        setSize(Number(new URLSearchParams(search).get('size')))
        setQty(Number(new URLSearchParams(search).get('qty')))
        
    }, [])

    console.log(date)
    
    const items = [
        "React", "CSS"
    ]

    const submitProductionDetails = () => {
        ProductionService.updateProductionRecord("dash_page",Number(id), date, Number(size), inputValue, Number(qty)).then(response => {
            setAlert(true)
            clearFields()
            console.log(response)
            setSuccessRecordId(response.data.pid)
            ActivityLogsService.createLog(PAGES.Production, AuthService.getCurrentUser().name, ACTIONS.EDIT, 1)
            .catch((error) => {
                console.log(error)
                swal("Error!", "Something Went Wrong With Logging", "error");
            })
        }).catch(error => {
            console.log(error.response.data.message)
            setAlert(false)
            swal("Error!", error.response.data.message, "error");
            ActivityLogsService.createLog(PAGES.Production, AuthService.getCurrentUser().name, ACTIONS.EDIT, 0)
            .catch((error) => {
                console.log(error)
                swal("Error!", "Something Went Wrong With Logging", "error");
            })
        }) 
    }

    const handleKeypress = async e => {
        if (e.key === 'Enter') {
            let auth = false
            const roles = AuthService.getCurrentUser().roles.map(role => {
                return role.replace("ROLE_", "").toLowerCase()
            })
            let access = null
            const newRoles = []
            await PermissionsService.getPermissionList("dash_page")
                .then(response => {
                    const { PageAccessList } = response.data
                    const accessItem = PageAccessList.find(o => o.page_name === PAGES.Production)
                    access = accessItem
                    if (roles.includes("admin") && accessItem.edit_admin == 1) {
                        auth = true
                        newRoles.push("admin")
                    }
                    if (roles.includes("moderator") && accessItem.edit_mod == 1) {
                        auth = true
                        newRoles.push("moderator")
                    } 
                })
            if (auth) {
                await PermissionsService.actionPinCodeAuth(newRoles, pin)
                    .then(response => {
                        submitProductionDetails();
                        setVisible(false)
                        setPin("")
                    }).catch(error => {
                        setPin("")
                        swal("Error!", error.response.data.message, "error");
    
                    })
            } else {
                if(access["edit_admin"] == 1) {
                    await PermissionsService.actionPinCodeAuth(['admin'], pin)
                    .then(response => {
                        submitProductionDetails();
                        setVisible(false)
                        setPin("")
                    }).catch(error => {
                        setPin("")
                        swal("Error!", "Unauthorized. Please Enter Admin Pin Code", "error");
                    })
                }
                setPin("")
                swal("Error!", "Unauthorized", "error");
            }
    
         
        }
    };

    const clearFields = () => {
        setDate(null)
        setSize(null)
        setInputValue("")
        setQty(null)
    }
    return (
        <div className='body mb-5 d-flex flex-column min-vh-100' style={{ overflow: 'hidden', backgroundColor: "#DAE3F3", borderRadius: "1%" }}>
            {alert ? <CAlert
                color="success"
                style={{ textAlign: "center", }}
                dismissible
                onClose={() => setAlert(!alert)}
            >
                Production <strong>#PIN{successRecordId}</strong> Updated Successfully
            </CAlert> : <div className='mb-5'></div>}
            <CRow className='mt-5'>
                <CCol md={2}></CCol>
                <CCol
                    className='add_header'
                    style={{ fontSize: '2em' }}
                >
                    Production <span style={{ color: "#0072C7" }}>#PIN{id}</span> details
                </CCol>
            </CRow>

            <CRow className="mt-5">
                <CCol></CCol>
                <CCol>
                    <CRow className="mb-3">
                        <CFormLabel htmlFor="date" className="col-sm-2 col-form-label">Date</CFormLabel>
                        <CCol sm={10}>
                            <CFormInput
                                style={{ backgroundColor: '#F2F2F2' }}
                                type="datetime-local"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                id="date" />
                        </CCol>
                    </CRow>
                    <CRow className="mb-3">
                        <CFormLabel htmlFor="size" className="col-sm-2 col-form-label">Size</CFormLabel>
                        <CCol sm={10}>
                            <CFormInput
                                style={{ backgroundColor: '#F2F2F2' }}
                                type="text"
                                placeholder="PlyWood Size in (mm)"
                                value={size}
                                onChange={(e) => setSize(e.target.value)}
                                id="size" />
                        </CCol>
                    </CRow>
                    <CRow className="mb-3">
                        <CFormLabel htmlFor="type" className="col-sm-2 col-form-label">Type</CFormLabel>
                        <CCol sm={10} style={{ position: 'relative' }}>
                            <CFormInput
                                style={{ backgroundColor: '#F2F2F2' }}
                                type="text"
                                autocomplete="off"
                                placeholder="PlyWood Type Name"
                                onFocus={() => setIsFocus(true)}
                                onBlur={() => {
                                    if (!isHovered) {
                                        setIsFocus(false)
                                    }
                                }}
                                value={inputValue}
                                ref={inputRef}
                                onChange={(e) => setInputValue(e.target.value)}
                                id="type" />
                            {isFocus && (
                                <div
                                    className='shadow-lg w-full'
                                    style={{ position: 'absolute', width: '95%', backgroundColor: "#fff" }}
                                    onMouseEnter={() => setIsHovered(true)}
                                    onMouseLeave={() => setIsHovered(false)}
                                >
                                    {items.map((suggest, key) => {
                                        const isMatch = suggest.toLowerCase().indexOf(inputValue.toLowerCase()) > -1


                                        return (
                                            <div key={key}>
                                                {isMatch && (
                                                    <div
                                                        className='p-2 dropdown-row'
                                                        style={{ cursor: 'pointer', fontSize: '0.8em' }}
                                                        onClick={() => {
                                                            setInputValue(suggest)
                                                            inputRef.current.focus()
                                                        }}>
                                                        {suggest}
                                                    </div>
                                                )}
                                            </div>
                                        )
                                    })}
                                </div>)}
                        </CCol>
                    </CRow>
                    <CRow className="mb-4">
                        <CFormLabel htmlFor="qty" className="col-sm-2 col-form-label">Qty</CFormLabel>
                        <CCol sm={10}>
                            <CFormInput
                                style={{ backgroundColor: '#F2F2F2' }}
                                type="number"
                                placeholder="How many?"
                                value={qty}
                                onChange={(e) => setQty(e.target.value)}
                                autoComplete={items}
                                id="qty" />
                        </CCol>
                    </CRow>
                    <div className="mt-5 d-flex flex-row-reverse" >
                        <CButton
                            onClick={() => setVisible(!visible)}
                            color="success"
                            shape="rounded-pill"
                            style={{ color: "#fff", backgroundColor: '#00B050', paddingRight: "30px", paddingLeft: "30px", fontSize: "0.9em", fontWeight: "700" }}
                        >
                            SUBMIT
                        </CButton>
                    </div>
                </CCol>
                <CCol></CCol>
            </CRow>
            <CModal
                style={{ marginTop: "30%", padding: "5%" }}
                visible={visible}
                onClose={() => setVisible(false)}>
                <CModalBody
                    style={{ textAlign: "center" }}>
                    <span
                        style={{ fontSize: '5em', color: '#C55A11' }}
                        className="material-symbols-outlined">
                        warning
                    </span>
                    <p
                        className='fs-3'>
                        Are you sure?
                    </p>
                    <p
                        style={{ color: '#00B050' }}>
                        {size}mm {inputValue} : {qty}
                    </p>
                    <p
                        style={{ fontSize: '0.8em', marginBottom: "5px" }}>
                        To continue please enter admin pin code and press Enter key
                    </p>
                    <div
                        className='d-grid gap-2 d-md-flex justify-content-md-center'>
                        <CFormInput
                            style={{ backgroundColor: '#F2F2F2' }}
                            type="number"
                            autoFocus
                            onKeyPress={handleKeypress}
                            id="qty" />
                        <CButton
                            color="danger"
                            style={{ backgroundColor: '#FF5B5B', color: '#fff' }}
                            onClick={() => setVisible(false)}>
                            Cancel
                        </CButton>
                    </div>
                </CModalBody>
            </CModal>
        </div>
    )
}

export default EditProductionRecord